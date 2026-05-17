// One-shot: create the 5 Compliance Spine Risk Map custom fields in GHL.
// Reads creds from .env. Skips creation if a field with the same name already exists.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const TOKEN = env.GHL_API_KEY;
const LOCATION_ID = env.GHL_LOCATION_ID;
const BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';
if (!TOKEN) { console.error('Missing GHL_API_KEY in .env'); process.exit(1); }
if (!LOCATION_ID) { console.error('Missing GHL_LOCATION_ID in .env'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Version: VERSION,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const FIELDS = [
  { name: 'RM Product Inquiry', dataType: 'TEXT' },
  { name: 'RM Offer Price',     dataType: 'TEXT' },
  { name: 'RM Company',         dataType: 'TEXT' },
  { name: 'RM Submitted At',    dataType: 'DATE' },
  { name: 'RM Stage',           dataType: 'TEXT' },
];

async function getExisting() {
  const r = await fetch(`${BASE}/locations/${LOCATION_ID}/customFields`, { headers });
  if (!r.ok) throw new Error(`List custom fields failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.customFields || [];
}

async function createField(name, dataType) {
  const r = await fetch(`${BASE}/locations/${LOCATION_ID}/customFields`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, dataType, model: 'contact', position: 0 }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Create failed for "${name}": ${r.status} ${text}`);
  return JSON.parse(text);
}

const existing = await getExisting();
const existingByName = new Map(existing.map(f => [f.name, f]));

const results = [];
for (const f of FIELDS) {
  if (existingByName.has(f.name)) {
    const e = existingByName.get(f.name);
    console.log(`SKIP  "${f.name}"  exists  id=${e.id}  key=${e.fieldKey}`);
    results.push({ name: f.name, action: 'skip', id: e.id, key: e.fieldKey, dataType: e.dataType });
    continue;
  }
  try {
    const out = await createField(f.name, f.dataType);
    const created = out.customField || out;
    console.log(`OK    "${f.name}"  id=${created.id}  key=${created.fieldKey}`);
    results.push({ name: f.name, action: 'created', id: created.id, key: created.fieldKey, dataType: created.dataType });
  } catch (e) {
    console.error('FAIL', f.name, e.message);
    results.push({ name: f.name, action: 'error', error: e.message });
  }
}

console.log('\n--- summary ---');
for (const r of results) {
  console.log(`${r.action.padEnd(8)} ${r.name.padEnd(22)} id=${r.id || '-'}  key=${r.key || '-'}`);
}
