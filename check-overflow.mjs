import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Mobile viewport
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000/12-month-culture-calendar.html', { waitUntil: 'networkidle2', timeout: 30000 });

// Navigate to Phase 2
await page.evaluate(() => {
  state.firstName = 'Test';
  state.email = 'test@example.com';
  // Set all phase 1 answers
  ['a','b','c','d'].forEach(s => { for (let i = 1; i <= 5; i++) answers[s+i] = 3; });
  // Show phase transition screen (screen-3)
  showScreen('screen-3');
});
await new Promise(r => setTimeout(r, 500));

// Screenshot the phase transition
let outPath = path.join(screenshotDir, 'phase2-transition-mobile.png');
await page.screenshot({ path: outPath, fullPage: true });
console.log('Saved:', outPath);

// Now start phase 2
await page.evaluate(() => startPhase2());
await new Promise(r => setTimeout(r, 500));
outPath = path.join(screenshotDir, 'phase2-q1-mobile.png');
await page.screenshot({ path: outPath, fullPage: true });
console.log('Saved:', outPath);

// Also screenshot the results screen (screen-4)
await page.evaluate(() => {
  calendarInputs.teamSize = 'small';
  calendarInputs.primaryGoal = 'revenue';
  calendarInputs.teamCelebrates = 'milestones';
  calendarInputs.startQuarter = 'q1';
  calendarInputs.cultureVision = 'ownership';
  window.sendWebhook = () => {};
  generateResults();
});
await new Promise(r => setTimeout(r, 1500));
outPath = path.join(screenshotDir, 'results-mobile.png');
await page.screenshot({ path: outPath, fullPage: true });
console.log('Saved:', outPath);

// Screenshot the implementation plan (screen-5)
await page.evaluate(() => showScreen('screen-5'));
await new Promise(r => setTimeout(r, 500));
outPath = path.join(screenshotDir, 'implementation-mobile.png');
await page.screenshot({ path: outPath, fullPage: true });
console.log('Saved:', outPath);

await browser.close();
