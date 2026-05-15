import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inPath = path.join(__dirname, 'temporary screenshots', '12mcc-ghl-build-guide.html');
const outPath = path.join(__dirname, 'temporary screenshots', '12mcc-ghl-build-guide.pdf');

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('file://' + inPath, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
});

await browser.close();
console.log('PDF saved to:', outPath);
