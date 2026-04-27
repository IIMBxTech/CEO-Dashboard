import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const SA = JSON.parse(readFileSync('service-account.json', 'utf8'));
const SPREADSHEET_ID = '1TBHbIY05wYkIflIZd9rFPQcDw1e0up8WSHwcIs3gxv4';

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
  return `${header}.${payload}.${sign.sign(SA.private_key, 'base64url')}`;
}

async function main() {
  const jwt = makeJWT();
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const token = (await tokenRes.json()).access_token;

  const range = encodeURIComponent(`'Overview Timeline Mother Sheet'!A1:Z5`);
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueRenderOption=FORMULA`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  console.log(`\n=== Overview Timeline Mother Sheet (Formulas) ===`);
  data.values.forEach((row, i) => console.log(`  Row ${i}: ${JSON.stringify(row)}`));

  const range2 = encodeURIComponent(`'Copy of Overview Timeline Mother Sheet'!A1:Z5`);
  const dataRes2 = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range2}?valueRenderOption=FORMULA`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data2 = await dataRes2.json();
  console.log(`\n=== Copy of Overview Timeline Mother Sheet (Formulas) ===`);
  data2.values.forEach((row, i) => console.log(`  Row ${i}: ${JSON.stringify(row)}`));
}

main().catch(e => console.error(e));
