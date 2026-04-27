const { google } = require('googleapis');
require('dotenv').config();

async function discover() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const sid = process.env.SPREADSHEET_ID;
  console.log('Using Spreadsheet ID:', sid);

  // Get sheet names
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sid,
    fields: 'sheets.properties.title,sheets.properties.sheetId',
  });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);
  console.log('\n=== SHEET TABS ===');
  console.log(JSON.stringify(sheetNames, null, 2));

  // Get first 5 rows of each sheet
  for (const name of sheetNames) {
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `'${name}'!A1:Z5`,
      });
      console.log(`\n=== ${name} (first 5 rows) ===`);
      if (r.data.values) {
        r.data.values.forEach((row, i) => console.log(`  Row ${i}: ${JSON.stringify(row)}`));
      } else {
        console.log('  (empty)');
      }
    } catch (e) {
      console.log(`\n=== ${name} ERROR: ${e.message} ===`);
    }
  }
}

discover().catch(e => console.error('FATAL:', e.message));
