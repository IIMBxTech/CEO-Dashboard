import { NextResponse } from 'next/server';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

/**
 * Program → Sheet configuration.
 *
 * Each entry defines HOW to read courses for that program.
 *   sheetEnvVar : env variable holding the sheet name (optional override).
 *                 Falls back to defaultSheet if not set.
 *   defaultSheet: hardcoded default sheet name when no env var is provided.
 *   nameCol     : 0-based column index of the course/domain name.
 *   valueCol    : 0-based column index of the completion percentage (numeric or "xx%").
 *   enabled     : whether this program has live data. Set via env var to true.
 *                 If false → return [] so the UI shows "No data" instead of
 *                 leaking another program's rows.
 */
const PROGRAM_CONFIG: Record<string, {
  sheetEnvVar: string;
  defaultSheet: string;
  nameCol: number;
  valueCol: number;
  enabledEnvVar: string;
}> = {
  'Swayam': {
    sheetEnvVar:    'SWAYAM_SHEET',
    defaultSheet:   'EaSE Dasboard Skeleton',
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'SWAYAM_ENABLED',
  },
  'BBA DBE': {
    sheetEnvVar:    'BBA_DBE_SHEET',
    defaultSheet:   'New Courses',
    nameCol:        0,
    valueCol:       4,  // feedbackCount → will be ratio'd against col 1
    enabledEnvVar:  'BBA_DBE_ENABLED',
  },
  'Airlines': {
    sheetEnvVar:    'AIRLINES_SHEET',
    defaultSheet:   '',          // no sheet yet
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'AIRLINES_ENABLED',
  },
  'eDX': {
    sheetEnvVar:    'EDX_SHEET',
    defaultSheet:   '',
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'EDX_ENABLED',
  },
  'FinTech': {
    sheetEnvVar:    'FINTECH_SHEET',
    defaultSheet:   '',
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'FINTECH_ENABLED',
  },
  'HM': {
    sheetEnvVar:    'HM_SHEET',
    defaultSheet:   '',
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'HM_ENABLED',
  },
  'iGot': {
    sheetEnvVar:    'IGOT_SHEET',
    defaultSheet:   '',
    nameCol:        1,
    valueCol:       8,
    enabledEnvVar:  'IGOT_ENABLED',
  },
};

/** Extract spreadsheet ID from a full Google Sheets URL or bare ID */
function extractSpreadsheetId(link: string): string {
  const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : link.trim();
}

/** Minimal CSV parser that handles quoted fields with embedded commas/newlines */
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchSheetRows(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv).slice(1); // strip header row
}

async function fetchCoursesForProgram(
  program: string,
  spreadsheetId: string
): Promise<{ name: string; value: number; color: string }[]> {

  const cfg = PROGRAM_CONFIG[program];
  if (!cfg) return []; // unknown program

  // Determine sheet name: env var → defaultSheet → nothing
  const sheetName = process.env[cfg.sheetEnvVar] || cfg.defaultSheet;

  // If no sheet is configured and not explicitly enabled, return empty
  const explicitlyEnabled = process.env[cfg.enabledEnvVar] === 'true';
  const hasSheet = sheetName.trim().length > 0;

  // Always allow Swayam and BBA DBE (they have hardcoded defaults)
  const alwaysOn = program === 'Swayam' || program === 'BBA DBE';

  if (!hasSheet && !explicitlyEnabled && !alwaysOn) {
    return []; // no data configured for this program yet
  }

  if (!hasSheet) return []; // still no sheet even if enabled flag set

  const rows = await fetchSheetRows(spreadsheetId, sheetName);

  // ── BBA DBE: special ratio logic ──────────────────────────────────
  if (program === 'BBA DBE') {
    return rows
      .map((row, i) => {
        const name = String(row[0] || '').trim();
        const total = parseFloat(row[1] || '0');
        const feedback = parseFloat(row[4] || '0');
        const value = total > 0 ? Math.min(100, Math.round((feedback / total) * 100)) : 0;
        return { name, value, color: COLORS[i % COLORS.length] };
      })
      .filter(r => r.name);
  }

  // ── Swayam & future EaSE-style sheets ─────────────────────────────
  // The sheet uses merged cells: course name only appears in the FIRST row of
  // a block; subsequent rows (M2, M3, …) have an empty name cell.
  // We track the "currentCourse" across rows, exactly like the stages API.
  const courseMap = new Map<string, { sum: number; count: number }>();
  let currentCourse = '';

  for (const row of rows) {
    const name = String(row[cfg.nameCol] ?? '').trim();
    if (name) currentCourse = name; // update when a new name appears

    if (!currentCourse) continue; // skip leading empty rows before first course

    const raw = String(row[cfg.valueCol] ?? '').replace('%', '').trim();
    if (raw === '') continue; // skip genuinely empty cells (no data at all)

    const val = Math.min(100, Math.max(0, parseFloat(raw) || 0));
    if (!courseMap.has(currentCourse)) courseMap.set(currentCourse, { sum: 0, count: 0 });
    const entry = courseMap.get(currentCourse)!;
    entry.sum += val;
    entry.count += 1;
  }

  return Array.from(courseMap.entries()).map(([name, { sum, count }], i) => ({
    name,
    value: Math.round(sum / count),
    color: COLORS[i % COLORS.length],
  }));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const program = url.searchParams.get('program') || 'Swayam';

    const link = process.env.SPREADSHEET_LINK;
    if (!link) throw new Error('SPREADSHEET_LINK not set');
    const spreadsheetId = extractSpreadsheetId(link);

    const data = await fetchCoursesForProgram(program, spreadsheetId);
    return NextResponse.json({ success: true, data, source: 'sheets', program });
  } catch (err: any) {
    console.warn('[courses] Error:', err?.message);
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 500 });
  }
}
