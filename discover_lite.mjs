import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const SA = JSON.parse(readFileSync('service-account.json', 'utf8'));
const SPREADSHEET_ID = '1TBHbIY05wYkIflIZd9rFPQcDw1e0up8WSHwcIs3gxv4';

// Build JWT manually
function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: SA.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(SA.private_key, 'base64url');
  return `${header}.${payload}.${signature}`;
}

async function getToken() {
  const jwt = makeJWT();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  console.log('Getting access token...');
  const token = await getToken();
  console.log('Token obtained, length:', token?.length);

  // Get spreadsheet metadata
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheetNames = meta.sheets.map(s => s.properties.title);
  console.log('\n=== SHEET TABS ===');
  console.log(JSON.stringify(sheetNames, null, 2));

  // Fetch first 5 rows of each
  for (const name of sheetNames) {
    const range = encodeURIComponent(`'${name}'!A1:Z5`);
    const dataRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await dataRes.json();
    console.log(`\n=== ${name} ===`);
    if (data.values) {
      data.values.forEach((row, i) => console.log(`  Row ${i}: ${JSON.stringify(row)}`));
    } else {
      console.log('  (empty or error)', JSON.stringify(data));
    }
  }
}

main().catch(e => console.error('FATAL:', e.message));
