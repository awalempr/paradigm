// One-shot: create the Compliance Spine Risk Map pipeline with 7 stages.
// Tries multiple known endpoint shapes since GHL v2 pipeline creation has shifted.

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
if (!TOKEN || !LOCATION_ID) { console.error('Missing creds in .env'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Version: VERSION,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const PIPELINE_NAME = 'Compliance Spine Risk Map';
const STAGES = [
  'Requested',
  'Discovery Booked',
  'In Delivery',
  'Delivered',
  'Converted',
  'Nurture',
  'Lost',
];

// First: list existing pipelines so we can detect duplicates and confirm GET works
async function listPipelines() {
  const r = await fetch(`${BASE}/opportunities/pipelines?locationId=${LOCATION_ID}`, { headers });
  const text = await r.text();
  if (!r.ok) throw new Error(`List pipelines failed: ${r.status} ${text}`);
  return JSON.parse(text);
}

const list = await listPipelines();
const pipelines = list.pipelines || list;
console.log(`Existing pipelines: ${pipelines.length}`);
for (const p of pipelines) console.log(`  - ${p.name}  id=${p.id}`);

const dupe = pipelines.find(p => p.name === PIPELINE_NAME);
if (dupe) {
  console.log(`\nPIPELINE ALREADY EXISTS: ${PIPELINE_NAME}  id=${dupe.id}`);
  console.log('Stages:');
  for (const s of (dupe.stages || [])) console.log(`  - ${s.name}  id=${s.id}  pos=${s.position}`);
  process.exit(0);
}

// Try a sequence of POST endpoints/payload shapes
const attempts = [
  {
    label: 'POST /opportunities/pipelines (with locationId in body)',
    url: `${BASE}/opportunities/pipelines`,
    body: { name: PIPELINE_NAME, locationId: LOCATION_ID, stages: STAGES.map((name, i) => ({ name, position: i })) },
  },
  {
    label: 'POST /locations/{id}/pipelines',
    url: `${BASE}/locations/${LOCATION_ID}/pipelines`,
    body: { name: PIPELINE_NAME, stages: STAGES.map((name, i) => ({ name, position: i })) },
  },
  {
    label: 'POST /opportunities/pipelines (stages with showInFunnel)',
    url: `${BASE}/opportunities/pipelines`,
    body: {
      name: PIPELINE_NAME, locationId: LOCATION_ID,
      stages: STAGES.map((name, i) => ({ name, position: i, showInFunnel: true, showInPieChart: true })),
    },
  },
];

let success = null;
for (const a of attempts) {
  console.log(`\nTrying: ${a.label}`);
  const r = await fetch(a.url, { method: 'POST', headers, body: JSON.stringify(a.body) });
  const text = await r.text();
  console.log(`  ${r.status}  ${text.slice(0, 200)}`);
  if (r.ok) {
    success = { attempt: a, response: JSON.parse(text) };
    break;
  }
}

if (!success) {
  console.error('\nAll attempts failed. Pipeline creation may not be supported via API for this token scope.');
  console.error('Build it in GHL UI: Settings → Pipelines → New, then add the 7 stages in order above.');
  process.exit(2);
}

const created = success.response.pipeline || success.response;
console.log('\n--- created ---');
console.log(`Pipeline: ${created.name}  id=${created.id}`);
console.log('Stages:');
for (const s of (created.stages || [])) console.log(`  ${s.position} · ${s.name}  id=${s.id}`);
