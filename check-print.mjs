import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000/12-month-culture-calendar.html', { waitUntil: 'networkidle2', timeout: 30000 });

// Fill in assessment and generate results
await page.evaluate(() => {
  state.firstName = 'Test';
  state.email = 'test@example.com';
  ['a','b','c','d'].forEach(s => { for (let i = 1; i <= 5; i++) answers[s+i] = 3; });
  calendarInputs.teamSize = 'small';
  calendarInputs.primaryGoal = 'revenue';
  calendarInputs.teamCelebrates = 'milestones';
  calendarInputs.startQuarter = 'q1';
  calendarInputs.cultureVision = 'ownership';
  window.sendWebhook = () => {};
  generateResults();
});
await new Promise(r => setTimeout(r, 2000));

// Emulate print media to see exactly what the download looks like
await page.emulateMediaType('print');
await new Promise(r => setTimeout(r, 500));

const outPath = path.join(screenshotDir, 'print-preview.png');
await page.screenshot({ path: outPath, fullPage: true });
console.log('Saved:', outPath);

await browser.close();
