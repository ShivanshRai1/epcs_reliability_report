/**
 * Screenshots from the live Netlify report (what readers see).
 * Run: npm run capture-netlify-guide
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'guide-screenshots');
const BASE = 'https://epcs-reliability-report.netlify.app';
const VIEWPORT = { width: 1280, height: 800 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = [
  { file: 'home.png', path: '/' },
  { file: 'page-01-index.png', path: '/page/1' },
  { file: 'page-04-heading.png', path: '/page/4' },
  { file: 'page-05-table.png', path: '/page/5' },
  { file: 'page-07-qualified-table.png', path: '/page/7' },
  { file: 'page-09-image.png', path: '/page/9' },
  { file: 'page-13-split.png', path: '/page/13' },
  { file: 'page-15-split.png', path: '/page/15' },
  { file: 'page-50-split.png', path: '/page/50' },
  { file: 'page-01-live.png', path: '/page/1?live=1' },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  for (const { file, path: pagePath } of PAGES) {
    const url = `${BASE}${pagePath}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await sleep(3000);
      await page.screenshot({
        path: path.join(OUT_DIR, file),
        type: 'png',
        fullPage: false,
      });
      console.log('✓', file, '←', url);
    } catch (err) {
      console.warn('✗', file, err.message);
    }
  }

  await browser.close();
  console.log(`\nSaved to public/guide-screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
