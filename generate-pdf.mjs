import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'temporary screenshots', 'culture-calendar-print.pdf');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/12-month-culture-calendar.html', { waitUntil: 'networkidle2', timeout: 30000 });

// Fill in dummy assessment data and jump to results
await page.evaluate(() => {
  // Set gate info
  state.firstName = 'Test';
  state.email = 'test@example.com';

  // Set phase 1 answers (5 questions per section, 4 sections = 20 questions)
  const sections = ['a','b','c','d'];
  sections.forEach(s => {
    for (let i = 1; i <= 5; i++) {
      answers[s + i] = 3; // mid-range answers
    }
  });

  // Set phase 2 calendar inputs
  calendarInputs.teamSize = 'small';
  calendarInputs.primaryGoal = 'revenue';
  calendarInputs.teamCelebrates = 'milestones';
  calendarInputs.startQuarter = 'q1';
  calendarInputs.cultureVision = 'ownership';

  // Generate results (skip webhook by stubbing sendWebhook)
  window._origSendWebhook = window.sendWebhook;
  window.sendWebhook = () => {};
  generateResults();
  window.sendWebhook = window._origSendWebhook;
});

// Wait for animations/rendering
await new Promise(r => setTimeout(r, 2000));

// Generate PDF using print media
await page.pdf({
  path: outPath,
  landscape: true,
  printBackground: true,
  format: 'A4',
  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
});

await browser.close();
console.log('PDF saved to:', outPath);
