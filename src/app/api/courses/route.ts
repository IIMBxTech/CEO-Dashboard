import { NextResponse } from 'next/server';

// Fallback mock data if Sheets is unavailable
const FALLBACK_DATA = [
  { name: 'Analytics Bootcamp', value: 65, color: '#ef4444' },
  { name: 'Leadership Track',   value: 82, color: '#3b82f6' },
  { name: 'Finance Essentials', value: 91, color: '#10b981' },
  { name: 'Digital Marketing',  value: 47, color: '#f59e0b' },
  { name: 'Product Strategy',   value: 73, color: '#8b5cf6' },
  { name: 'Data Science Pro',   value: 88, color: '#06b6d4' },
];

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

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

async function fetchSheetData(link: string, spreadsheetId: string, sheetName: string) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) return [];
  const csv = await res.text();
  const rows = parseCSV(csv);
  return rows.slice(1);
}

async function fetchFromSheets(program?: string | null) {
  const link = process.env.SPREADSHEET_LINK;
  if (!link) throw new Error('SPREADSHEET_LINK not set');
  const spreadsheetId = extractSpreadsheetId(link);

  let courses: { name: string, value: number, color: string }[] = [];
  
  if (!program || program === 'All' || program === 'Swayam') {
    // 1. Process Skeleton (Swayam Course Data)
    const mainRows = await fetchSheetData(link, spreadsheetId, 'EaSE Dasboard Skeleton');
    const mainCourses = mainRows.map((row, i) => {
      const name  = String(row[1] || '').trim();
      const raw   = String(row[8] || '0').replace('%', '').trim();
      const value = Math.min(100, Math.max(0, Math.round(parseFloat(raw) || 0)));
      return { name, value, color: COLORS[i % COLORS.length] };
    }).filter(r => r.name);
    courses.push(...mainCourses);
  }

  if (!program || program === 'All' || program === 'BBA DBE') {
    // 2. Process New Courses (BBA DBE)
    const newCourseRows = await fetchSheetData(link, spreadsheetId, 'New Courses');
    const bbaCourses = newCourseRows.map((row, i) => {
      const domain = String(row[0] || '').trim();
      const courseCount = parseFloat(row[1] || '0');
      const feedbackCount = parseFloat(row[4] || '0');
      let value = 0;
      if (courseCount > 0) {
         value = Math.min(100, Math.round((feedbackCount / courseCount) * 100));
      }
      return { name: domain, value, color: COLORS[(courses.length + i) % COLORS.length] };
    }).filter(r => r.name);
    courses.push(...bbaCourses);
  }
  
  // 3. Process Timeline (Overall Aggregate)
  const timelineRows = await fetchSheetData(link, spreadsheetId, 'Overview Timeline Mother Sheet');
  if (timelineRows.length > 0) {
    let sum = 0, count = 0;
    timelineRows.forEach(r => {
      const p = parseFloat(String(r[8] || '').replace('%', ''));
      if (!isNaN(p)) { sum += p; count++; }
    });
    if (count > 0) courses.push({ name: 'Timeline Operations', value: Math.round(sum / count), color: COLORS[(courses.length) % COLORS.length] });
  }

  // 4. Process Finance (Overall Aggregate)
  const financeRows = await fetchSheetData(link, spreadsheetId, 'Mother_Sheet_Finance_July_25');
  if (financeRows.length > 0) {
    let sum = 0, count = 0;
    financeRows.forEach(r => {
      const p = parseFloat(String(r[7] || '').replace('%', ''));
      if (!isNaN(p)) { sum += p; count++; }
    });
    if (count > 0) courses.push({ name: 'Finance Execution', value: Math.round(sum / count), color: COLORS[(courses.length) % COLORS.length] });
  }

  return courses;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const program = url.searchParams.get('program');
    const data = await fetchFromSheets(program);
    return NextResponse.json({ success: true, data, source: 'sheets' });
  } catch (err: any) {
    console.warn('[courses] Sheets unavailable, using fallback:', err?.message);
    return NextResponse.json({ success: true, data: FALLBACK_DATA, source: 'fallback' });
  }
}
