import puppeteer from 'puppeteer';
import { Remarkable } from 'remarkable';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const md = new Remarkable('full', {
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

// Targets: [inputMarkdownPath, outputPdfPath]
const targets = [
  ['compliance-spine-risk-map-ghl-build.md', 'compliance-spine-risk-map-ghl-build.pdf'],
  ['distribution/01-podcast-outreach.md',    'distribution/01-podcast-outreach.pdf'],
  ['distribution/02-guest-content.md',       'distribution/02-guest-content.pdf'],
  ['distribution/03-directories.md',         'distribution/03-directories.pdf'],
];

const CSS = `
  @page { margin: 18mm 18mm 22mm 18mm; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { background: #ffffff; color: #1a1a1a; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 0 4mm; }
  h1, h2, h3, h4 {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    color: #0d0d0d;
    letter-spacing: -0.01em;
    line-height: 1.2;
    page-break-after: avoid;
  }
  h1 {
    font-size: 22pt;
    font-weight: 600;
    margin: 0 0 14pt;
    padding-bottom: 8pt;
    border-bottom: 1.5px solid #0c8ce9;
    letter-spacing: -0.025em;
  }
  h2 {
    font-size: 15pt;
    font-weight: 600;
    margin: 22pt 0 8pt;
    padding-top: 6pt;
    border-top: 1px solid #e5e5e5;
    color: #0d0d0d;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    margin: 14pt 0 6pt;
    color: #0c8ce9;
  }
  h4 {
    font-size: 10.5pt;
    font-weight: 600;
    margin: 10pt 0 4pt;
    color: #0d0d0d;
  }
  p { margin: 6pt 0; orphans: 3; widows: 3; }
  strong { color: #0d0d0d; font-weight: 600; }
  em { font-style: italic; }
  a { color: #0c6cb9; text-decoration: none; word-break: break-word; }
  a:hover { text-decoration: underline; }

  ul, ol { margin: 6pt 0 6pt 0; padding-left: 18pt; }
  li { margin: 2pt 0; }
  li > p { margin: 2pt 0; }

  code {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 9pt;
    background: #f4f4f4;
    color: #b13a00;
    padding: 1pt 4pt;
    border-radius: 3px;
  }
  pre {
    background: #161616;
    color: #f5f5f5;
    padding: 10pt 12pt;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.45;
    margin: 10pt 0;
    page-break-inside: avoid;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: 9pt;
  }
  blockquote {
    margin: 10pt 0;
    padding: 6pt 12pt;
    border-left: 3px solid #0c8ce9;
    background: #f4f9fd;
    color: #2a2a2a;
    font-style: italic;
  }
  hr {
    border: none;
    border-top: 1px solid #d0d0d0;
    margin: 18pt 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  thead {
    background: #0d0d0d;
    color: #ffffff;
  }
  th {
    text-align: left;
    padding: 6pt 8pt;
    font-weight: 600;
    font-size: 9pt;
    letter-spacing: 0.02em;
  }
  td {
    padding: 5pt 8pt;
    border-top: 1px solid #e5e5e5;
    vertical-align: top;
  }
  tbody tr:nth-child(even) td { background: #fafafa; }

  .doc-header {
    padding: 14pt 0 18pt;
    margin-bottom: 12pt;
    border-bottom: 1.5px solid #0d0d0d;
  }
  .doc-eyebrow {
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0c8ce9;
    margin-bottom: 4pt;
  }
  .doc-brand {
    font-size: 11pt;
    font-weight: 600;
    color: #0d0d0d;
    letter-spacing: -0.005em;
  }
  .doc-meta {
    font-size: 8.5pt;
    color: #707070;
    margin-top: 2pt;
  }

  /* Pagination / break hints */
  h2 { page-break-before: auto; }
  table, pre, blockquote { page-break-inside: avoid; }
`;

function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <div class="doc-header">
      <div class="doc-eyebrow">Paradigm Consulting · Internal</div>
      <div class="doc-brand">${title}</div>
      <div class="doc-meta">paradigmconsulting.io</div>
    </div>
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function titleFromMarkdown(mdText, fallback) {
  const m = mdText.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

async function build() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const [inRel, outRel] of targets) {
      const inAbs = path.join(__dirname, inRel);
      const outAbs = path.join(__dirname, outRel);
      if (!fs.existsSync(inAbs)) {
        console.warn('SKIP — input missing:', inRel);
        continue;
      }
      const mdText = fs.readFileSync(inAbs, 'utf8');
      // Strip the first H1 from the body since we render it in the header
      const bodyMd = mdText.replace(/^#\s+.+\n+/m, '');
      const title = titleFromMarkdown(mdText, path.basename(inRel, '.md'));
      const bodyHtml = md.render(bodyMd);
      const fullHtml = wrapHtml(title, bodyHtml);

      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });
      // give web fonts a moment
      await new Promise(r => setTimeout(r, 400));
      await page.pdf({
        path: outAbs,
        format: 'Letter',
        printBackground: true,
        margin: { top: '18mm', right: '18mm', bottom: '22mm', left: '18mm' },
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-family: 'Inter', sans-serif; font-size: 8pt; color: #707070; width: 100%; padding: 0 18mm; display: flex; justify-content: space-between;">
            <span>${title}</span>
            <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>`,
        headerTemplate: `<div></div>`,
      });
      await page.close();
      console.log('OK →', outRel);
    }
  } finally {
    await browser.close();
  }
}

build().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
