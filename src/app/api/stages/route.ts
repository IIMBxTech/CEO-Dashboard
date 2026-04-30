import { NextRequest, NextResponse } from 'next/server';

/**
 * Program → Sheet/column config for stage-level drill-down.
 *
 * sheetEnvVar   : env var holding the sheet name.
 * defaultSheet  : hardcoded default (empty = no data yet).
 * courseNameCol : column index of the course name.
 * stageNameCol  : column index of the stage/step name.
 * completionCol : column index of the completion percentage.
 * alwaysOn      : skip the "no data" guard for built-in programs.
 *
 * To wire a new program, add its env vars to .env:
 *   FINTECH_SHEET="My FinTech Sheet"
 *   FINTECH_ENABLED=true
 * And optionally add a custom stageNameCol / completionCol.
 */
const PROGRAM_STAGE_CONFIG: Record<string, {
  sheetEnvVar: string;
  defaultSheet: string;
  courseNameCol: number;
  stageNameCol: number;
  completionCol: number;
  alwaysOn: boolean;
}> = {
  'Swayam': {
    sheetEnvVar:    'SWAYAM_SHEET',
    defaultSheet:   'EaSE Dasboard Skeleton',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       true,
  },
  'BBA DBE': {
    sheetEnvVar:    'BBA_DBE_SHEET',
    defaultSheet:   'New Courses',
    courseNameCol:  0,
    stageNameCol:   -1,  // BBA DBE uses special ratio logic (see below)
    completionCol:  -1,
    alwaysOn:       true,
  },
  'Airlines': {
    sheetEnvVar:    'AIRLINES_SHEET',
    defaultSheet:   '',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       false,
  },
  'eDX': {
    sheetEnvVar:    'EDX_SHEET',
    defaultSheet:   '',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       false,
  },
  'FinTech': {
    sheetEnvVar:    'FINTECH_SHEET',
    defaultSheet:   '',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       false,
  },
  'HM': {
    sheetEnvVar:    'HM_SHEET',
    defaultSheet:   '',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       false,
  },
  'iGot': {
    sheetEnvVar:    'IGOT_SHEET',
    defaultSheet:   '',
    courseNameCol:  1,
    stageNameCol:   6,
    completionCol:  9,
    alwaysOn:       false,
  },
};

/** Extract spreadsheet ID from a full Google Sheets URL or bare ID */
function extractSpreadsheetId(link: string): string {
  const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : link.trim();
}

/** Minimal CSV parser */
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

async function fetchStages(courseQuery: string, program: string): Promise<{ stage: string; completion: number }[]> {
  const link = process.env.SPREADSHEET_LINK;
  if (!link) throw new Error('SPREADSHEET_LINK not set');
  const spreadsheetId = extractSpreadsheetId(link);

  const cfg = PROGRAM_STAGE_CONFIG[program] ?? PROGRAM_STAGE_CONFIG['Swayam'];

  // Determine sheet name
  const sheetName = process.env[cfg.sheetEnvVar] || cfg.defaultSheet;

  // Guard: if no sheet configured and not always-on, return empty
  if (!sheetName.trim() && !cfg.alwaysOn) return [];
  if (!sheetName.trim()) return [];

  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const rows = parseCSV(await res.text()).slice(1);

  // ── BBA DBE: synthetic stage breakdown ────────────────────────────
  if (program === 'BBA DBE') {
    for (const row of rows) {
      if (String(row[0] || '').trim() === courseQuery) {
        const total = parseFloat(row[1] || '0');
        if (total === 0) continue;
        return [
          { stage: 'Proposals Sent',  completion: Math.round((parseFloat(row[2] || '0') / total) * 100) },
          { stage: 'Committee Rcvd',  completion: Math.round((parseFloat(row[3] || '0') / total) * 100) },
          { stage: 'Feedback Rvwd',   completion: Math.round((parseFloat(row[4] || '0') / total) * 100) },
        ];
      }
    }
    return [];
  }

  // ── EaSE-style sheets (Swayam and future programs) ─────────────────
  // Track the current course as we scan rows (course name may only appear once
  // at the start of a block, not repeated for every stage row)
  const stages: { stage: string; completion: number }[] = [];
  let currentCourse = '';

  for (const row of rows) {
    const courseName = String(row[cfg.courseNameCol] ?? '').trim();
    if (courseName) currentCourse = courseName;

    if (currentCourse === courseQuery) {
      const stageName = String(row[cfg.stageNameCol] ?? '').trim();
      const rawComp   = String(row[cfg.completionCol] ?? '0').replace('%', '').trim();
      const compVal   = Math.min(100, Math.max(0, Math.round(parseFloat(rawComp) || 0)));
      if (stageName) stages.push({ stage: stageName, completion: compVal });
    }
  }

  return stages;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const course  = searchParams.get('course')  || '';
  const program = searchParams.get('program') || 'Swayam';

  if (!course) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const data = await fetchStages(course, program);
    return NextResponse.json({ success: true, data, source: 'sheets', program });
  } catch (err: any) {
    console.warn('[stages] Error:', err?.message);
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 500 });
  }
}
