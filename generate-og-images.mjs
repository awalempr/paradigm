import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Theme presets
const darkTheme = {
  bg: '#0d0d0d',
  headlineColor: '#fafafa',
  subtitleColor: '#a1a1aa',
  statValueColor: '#fafafa',
  statLabelColor: '#71717a',
  statBorder: '#3f3f46',
  catLabelColor: '#a1a1aa',
  barTrack: '#27272a',
  ringTrack: '#27272a',
  scoreLabelColor: '#71717a',
  scoreValueColor: '#fafafa',
  scoreTotalColor: '#52525b',
  brandColor: '#52525b',
  brandSubColor: '#3f3f46',
  gridColor: '#fff',
  gridOpacity: '0.03',
  badgeBg: 'rgba(34,197,94,0.08)',
  badgeBorder: 'rgba(34,197,94,0.2)',
  badgeDotColor: '#22c55e',
  badgeTextColor: '#22c55e',
};

const lightTheme = {
  bg: '#F8F9FA',
  headlineColor: '#1A1A1A',
  subtitleColor: '#4A5568',
  statValueColor: '#1A1A1A',
  statLabelColor: '#9CA3AF',
  statBorder: '#E2E8F0',
  catLabelColor: '#6B7280',
  barTrack: '#E2E8F0',
  ringTrack: '#E2E8F0',
  scoreLabelColor: '#9CA3AF',
  scoreValueColor: '#1A1A1A',
  scoreTotalColor: '#9CA3AF',
  brandColor: '#9CA3AF',
  brandSubColor: '#CBD5E1',
  gridColor: '#000',
  gridOpacity: '0.025',
  badgeBg: 'rgba(34,197,94,0.06)',
  badgeBorder: 'rgba(34,197,94,0.25)',
  badgeDotColor: '#16a34a',
  badgeTextColor: '#16a34a',
};

const images = [
  {
    filename: 'og-12-month-culture-calendar.png',
    theme: darkTheme,
    badge: 'FREE DIAGNOSTIC',
    headline: 'Do You Know Where<br>Your Team Is Headed?',
    subtitle: 'A two-phase diagnostic that builds a personalized 12-month culture calendar for your team.',
    stats: [
      { value: '20', label: 'QUESTIONS' },
      { value: '6 min', label: 'TO COMPLETE' },
      { value: '100', label: 'POINTS POSSIBLE' },
    ],
    scoreTotal: '/100',
    categories: [
      { name: 'MEETING RHYTHM', color: '#C4603A', width: '70%' },
      { name: 'TEAM DRIVERS', color: '#E8913A', width: '55%' },
      { name: 'SPRINT ARCHITECTURE', color: '#3B82F6', width: '60%' },
      { name: 'CULTURE ENERGY', color: '#22C55E', width: '45%' },
    ],
    accentColor: '#C4603A',
    glowColor: 'rgba(196,96,58,0.15)',
  },
  {
    filename: 'og-compliance-spine.png',
    theme: darkTheme,
    badge: 'FREE ASSESSMENT',
    headline: 'Find Your Compliance<br>Gaps Before They<br>Find You',
    subtitle: '7 questions across 6 compliance categories with personalized risk profile and financial exposure estimates.',
    stats: [
      { value: '7', label: 'QUESTIONS' },
      { value: '2 min', label: 'TO COMPLETE' },
      { value: '28', label: 'ITEMS ASSESSED' },
    ],
    scoreTotal: '/28',
    categories: [
      { name: 'LEGAL', color: '#EF4444', width: '65%' },
      { name: 'FINANCIAL', color: '#3B82F6', width: '55%' },
      { name: 'OPERATIONAL', color: '#F59E0B', width: '60%' },
      { name: 'DATA', color: '#22C55E', width: '50%' },
      { name: 'CONTRACTOR', color: '#8B5CF6', width: '45%' },
      { name: 'INSURANCE', color: '#7B8FA1', width: '40%' },
    ],
    accentColor: '#7B8FA1',
    glowColor: 'rgba(123,143,161,0.12)',
  },
  {
    filename: 'og-leverage-engine.png',
    theme: lightTheme,
    badge: 'FREE CALCULATOR',
    headline: 'How Much Is Your Time<br>Costing Your Business?',
    subtitle: 'Enter 4 numbers about your business and find out exactly how many founder hours need to become systems, delegation, and technology.',
    stats: [
      { value: '4', label: 'INPUTS' },
      { value: '60s', label: 'TO COMPLETE' },
      { value: '90', label: 'DAY ACTION PLAN' },
    ],
    scoreLabel: 'HOURS',
    scoreTotal: 'PER WEEK',
    categories: [
      { name: 'SYSTEMS', color: '#3B82F6', width: '65%' },
      { name: 'DELEGATION', color: '#22C55E', width: '55%' },
      { name: 'TECHNOLOGY', color: '#8B5CF6', width: '50%' },
    ],
    accentColor: '#8B9BAF',
    glowColor: 'rgba(139,155,175,0.08)',
  },
];

function buildHTML(img) {
  const t = img.theme;

  const categoryBars = img.categories
    .map(
      (c) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${img.categories.length > 5 ? '5' : '7'}px;">
        <div style="width:${img.categories.length > 5 ? '76px' : '110px'};text-align:right;font-family:'Space Mono',monospace;font-size:${img.categories.length > 5 ? '8px' : '9px'};color:${t.catLabelColor};letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;">${c.name}</div>
        <div style="flex:1;height:4px;background:${t.barTrack};border-radius:2px;overflow:hidden;">
          <div style="width:${c.width};height:100%;background:${c.color};border-radius:2px;"></div>
        </div>
      </div>`
    )
    .join('');

  const statItems = img.stats
    .map(
      (s, i) => `
      <div style="display:flex;flex-direction:column;gap:4px;${i > 0 ? `border-left:1px solid ${t.statBorder};padding-left:28px;` : ''}">
        <div style="font-family:'Figtree',sans-serif;font-size:28px;font-weight:800;color:${t.statValueColor};letter-spacing:-0.02em;">${s.value}</div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;color:${t.statLabelColor};letter-spacing:0.08em;text-transform:uppercase;">${s.label}</div>
      </div>`
    )
    .join('');

  const scoreLabel = img.scoreLabel || 'SCORE';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: ${t.bg};
      overflow: hidden;
      position: relative;
    }
  </style>
</head>
<body>
  <!-- Subtle radial glow top-right -->
  <div style="position:absolute;top:-80px;right:-80px;width:500px;height:500px;background:radial-gradient(circle,${img.glowColor},transparent 70%);pointer-events:none;"></div>

  <!-- Subtle grid texture -->
  <div style="position:absolute;inset:0;opacity:${t.gridOpacity};background-image:linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px);background-size:40px 40px;pointer-events:none;"></div>

  <div style="position:relative;z-index:1;display:flex;height:100%;padding:52px 56px 44px;">

    <!-- Left column -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding-right:40px;">

      <!-- Badge -->
      <div style="display:inline-flex;align-items:center;gap:8px;background:${t.badgeBg};border:1px solid ${t.badgeBorder};border-radius:20px;padding:6px 14px;width:fit-content;">
        <div style="width:7px;height:7px;border-radius:50%;background:${t.badgeDotColor};"></div>
        <span style="font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:${t.badgeTextColor};letter-spacing:0.1em;">${img.badge}</span>
      </div>

      <!-- Headline -->
      <div style="margin-top:24px;">
        <h1 style="font-family:'Figtree',sans-serif;font-size:48px;font-weight:800;color:${t.headlineColor};line-height:1.08;letter-spacing:-0.03em;">${img.headline}</h1>
        <p style="margin-top:16px;font-family:'Figtree',sans-serif;font-size:15px;color:${t.subtitleColor};line-height:1.55;max-width:420px;">${img.subtitle}</p>
      </div>

      <!-- Stats bar -->
      <div style="display:flex;align-items:flex-start;gap:28px;margin-top:auto;">
        ${statItems}
      </div>
    </div>

    <!-- Right column -->
    <div style="width:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;">

      <!-- Score circle -->
      <div style="position:relative;width:150px;height:150px;">
        <svg viewBox="0 0 150 150" style="width:150px;height:150px;transform:rotate(-90deg);">
          <circle cx="75" cy="75" r="66" fill="none" stroke="${t.ringTrack}" stroke-width="3"/>
          <circle cx="75" cy="75" r="66" fill="none" stroke="${img.accentColor}" stroke-width="3" stroke-dasharray="415" stroke-dashoffset="140" stroke-linecap="round" opacity="0.5"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-family:'Space Mono',monospace;font-size:9px;color:${t.scoreLabelColor};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2px;">${scoreLabel}</div>
          <div style="font-family:'Figtree',sans-serif;font-size:48px;font-weight:800;color:${t.scoreValueColor};line-height:1;">?</div>
          <div style="font-family:'Space Mono',monospace;font-size:13px;color:${t.scoreTotalColor};margin-top:-2px;">${img.scoreTotal}</div>
        </div>
      </div>

      <!-- Category bars -->
      <div style="width:100%;">
        ${categoryBars}
      </div>
    </div>
  </div>

  <!-- Bottom-right branding -->
  <div style="position:absolute;bottom:44px;right:56px;text-align:right;">
    <div style="font-family:'Figtree',sans-serif;font-size:13px;font-weight:700;color:${t.brandColor};letter-spacing:0.18em;text-transform:uppercase;">PARADIGM</div>
    <div style="font-family:'Figtree',sans-serif;font-size:8px;font-weight:500;color:${t.brandSubColor};letter-spacing:0.25em;text-transform:uppercase;margin-top:1px;">CONSULTING</div>
  </div>
</body>
</html>`;
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  for (const img of images) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
    await page.setContent(buildHTML(img), { waitUntil: 'networkidle0' });

    const outPath = path.join(__dirname, 'brand_assets', img.filename);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log('Saved:', outPath);
    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
