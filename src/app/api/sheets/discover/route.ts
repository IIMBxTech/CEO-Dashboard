import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const link = process.env.SPREADSHEET_LINK;
    if (!link) throw new Error('SPREADSHEET_LINK not set');

    const spreadsheetId = extractSpreadsheetId(link);
    const sheetName = encodeURIComponent('EaSE Dasboard Skeleton');
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);

    const csv = await res.text();
    const rows = parseCSV(csv);
    // Skip header row (row 0) — we only need data rows
    const dataRows = rows.slice(1);
    if (dataRows.length === 0) throw new Error('No data in sheet');

    const courses = new Set<string>();
    const stages = new Set<string>();

    dataRows.forEach(row => {
      // row[1] is Course Name
      // row[6] is Stage Name
      const courseName = String(row[1] || '').trim();
      const stageName = String(row[6] || '').trim();

      if (courseName && courseName !== 'Course Name' && courseName !== 'Course Title') {
        courses.add(courseName);
      }
      if (stageName && stageName !== 'Stage' && stageName !== 'Stage Name') {
        stages.add(stageName);
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        courses: Array.from(courses),
        stages: Array.from(stages),
      },
      source: 'sheets' 
    });
  } catch (err: any) {
    console.error('[discover] Error fetching discover data:', err?.message);
    return NextResponse.json({ success: false, error: err?.message, data: { courses: [], stages: [] } }, { status: 500 });
  }
}
