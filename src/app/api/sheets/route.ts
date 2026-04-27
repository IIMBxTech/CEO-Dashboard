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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sheetParam = searchParams.get('sheetName') || 'EaSE Dasboard Skeleton';
    
    const link = process.env.SPREADSHEET_LINK;
    if (!link) throw new Error('SPREADSHEET_LINK not set');

    const spreadsheetId = extractSpreadsheetId(link);
    const encodedSheetName = encodeURIComponent(sheetParam);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;

    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);

    const csv = await res.text();
    const rows = parseCSV(csv);
    if (rows.length === 0) throw new Error('No data in sheet');

    const headers = rows[0];
    const dataRows = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header.trim() || `Col${i}`] = row[i] ?? '';
      });
      return obj;
    });

    return NextResponse.json({ success: true, headers, data: dataRows, source: 'sheets', sheetName: sheetParam });
  } catch (err: any) {
    console.error('[sheets] Error fetching full sheet:', err?.message);
    return NextResponse.json({ success: false, error: err?.message, data: [], headers: [] }, { status: 500 });
  }
}
