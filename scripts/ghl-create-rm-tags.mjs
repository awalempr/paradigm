// One-shot: create the 6 Compliance Spine Risk Map tags in GHL.
// Reads creds from .env. Skips creation if a tag with the same name already exists.

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

const TAGS = [
  'compliance-spine-risk-map-lead',
  'compliance-spine-risk-map-booked',
  'compliance-spine-risk-map-paid',
  'compliance-spine-risk-map-delivered',
  'compliance-spine-risk-map-converted',
  'compliance-spine-risk-map-cold',
];

async function getExisting() {
  const r = await fetch(`${BASE}/locations/${LOCATION_ID}/tags`, { headers });
  if (!r.ok) throw new Error(`List tags failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.tags || [];
}

async function createTag(name) {
  const r = await fetch(`${BASE}/locations/${LOCATION_ID}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Create failed for "${name}": ${r.status} ${text}`);
  return JSON.parse(text);
}

const existing = await getExisting();
const existingByName = new Map(existing.map(t => [t.name, t]));

const results = [];
for (const name of TAGS) {
  if (existingByName.has(name)) {
    const e = existingByName.get(name);
    console.log(`SKIP  "${name}"  exists  id=${e.id}`);
    results.push({ name, action: 'skip', id: e.id });
    continue;
  }
  try {
    const out = await createTag(name);
    const created = out.tag || out;
    console.log(`OK    "${name}"  id=${created.id}`);
    results.push({ name, action: 'created', id: created.id });
  } catch (e) {
    console.error('FAIL', name, e.message);
    results.push({ name, action: 'error', error: e.message });
  }
}

console.log('\n--- summary ---');
for (const r of results) {
  console.log(`${r.action.padEnd(8)} ${r.name.padEnd(40)} id=${r.id || '-'}`);
}
