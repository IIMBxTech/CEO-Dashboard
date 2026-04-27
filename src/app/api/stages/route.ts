import { NextRequest, NextResponse } from 'next/server';

// Fallback data if sheets fail
const FALLBACK_DATA: Record<string, { stage: string; completion: number }[]> = {
  'Analytics Bootcamp': [
    { stage: 'CP1', completion: 80 }, { stage: 'CP2', completion: 45 },
    { stage: 'CP3', completion: 30 }, { stage: 'CP4', completion: 10 },
  ],
  'Securities, Market and Trading': [
    { stage: 'Recording', completion: 100 }, { stage: 'Edit Notes', completion: 100 },
    { stage: 'Editing', completion: 100 }, { stage: 'Course Build', completion: 100 },
  ],
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

async function fetchStagesFromSheets(courseQuery: string, program: string) {
  const link = process.env.SPREADSHEET_LINK;
  if (!link) throw new Error('SPREADSHEET_LINK not set');

  const spreadsheetId = extractSpreadsheetId(link);

  if (program === 'BBA DBE') {
    // For BBA DBE (Degree), map from the New Courses pipeline
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('New Courses')}`;
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    const rows = parseCSV(await res.text()).slice(1);

    const stages: { stage: string; completion: number }[] = [];
    for (const row of rows) {
      if (String(row[0] || '').trim() === courseQuery) {
        const total = parseFloat(row[1] || '0');
        if (total === 0) continue;
        stages.push({ stage: 'Proposals Sent', completion: Math.round((parseFloat(row[2] || '0') / total) * 100) });
        stages.push({ stage: 'Committee Rcvd', completion: Math.round((parseFloat(row[3] || '0') / total) * 100) });
        stages.push({ stage: 'Feedback Rvwd', completion: Math.round((parseFloat(row[4] || '0') / total) * 100) });
        break;
      }
    }
    return stages;
  }

  // Default / Swayam behavior
  const sheetName = encodeURIComponent('EaSE Dasboard Skeleton');
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const rows = parseCSV(await res.text()).slice(1);

  const stages: { stage: string; completion: number }[] = [];
  let currentCourse = '';
  for (const row of rows) {
    const courseName = String(row[1] || '').trim();
    if (courseName) currentCourse = courseName;

    if (currentCourse === courseQuery) {
      const stageName = String(row[6] || '').trim();
      const rawComp   = String(row[9] || '0').replace('%', '').trim();
      const compVal   = Math.min(100, Math.max(0, Math.round(parseFloat(rawComp) || 0)));
      if (stageName) stages.push({ stage: stageName, completion: compVal });
    }
  }
  return stages;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const course = searchParams.get('course') || '';
  const program = searchParams.get('program') || '';
  
  if (!course) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const data = await fetchStagesFromSheets(course, program);
    if (data.length > 0) {
        return NextResponse.json({ success: true, data, source: 'sheets' });
    } else {
        // Fallback if the course wasn't found in the sheet (for mocked course clicks)
        const fallback = FALLBACK_DATA[course] || FALLBACK_DATA['Analytics Bootcamp'] || [];
        return NextResponse.json({ success: true, data: fallback, source: 'fallback' });
    }
  } catch (err: any) {
    console.warn('[stages] Sheets unavailable, using fallback:', err?.message);
    const data = FALLBACK_DATA[course] || FALLBACK_DATA['Analytics Bootcamp'] || [];
    return NextResponse.json({ success: true, data, source: 'fallback' });
  }
}
