/**
 * Screenshots from the live Netlify report (what readers see) + key UI states.
 * Run: npm run capture-netlify-guide
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'guide-screenshots');
const BASE = 'https://epcs-reliability-report.netlify.app';
const VIEWPORT = { width: 1280, height: 900 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read-mode report pages (baseline page numbers; same URLs on Netlify). */
const REPORT_PAGES = [
  { file: 'home.png', path: '/', title: 'Cover' },
  { file: 'page-01-index.png', path: '/page/1', title: 'Index' },
  { file: 'page-02-index-continued.png', path: '/page/2', title: 'Index (continued)' },
  { file: 'page-04-heading.png', path: '/page/4', title: 'Heading — PART LISTS' },
  { file: 'page-05-table.png', path: '/page/5', title: 'Table — part numbers' },
  { file: 'page-06-table.png', path: '/page/6', title: 'Table — third generation' },
  { file: 'page-07-qualified-table.png', path: '/page/7', title: 'Qualified table' },
  { file: 'page-09-image.png', path: '/page/9', title: 'Image — derating' },
  { file: 'page-28-text-only.png', path: '/page/28', title: 'Text only — QCI details' },
  { file: 'page-13-split-links-image.png', path: '/page/13', title: 'Split links + image' },
  { file: 'page-15-split-links-image.png', path: '/page/15', title: 'Split links + image' },
  { file: 'page-23-split-links-image.png', path: '/page/23', title: 'Split links + image' },
  { file: 'page-41-split-text-image.png', path: '/page/41', title: 'Split text + image' },
  { file: 'page-49-split-image-links.png', path: '/page/49', title: 'Split image + links' },
  { file: 'page-50-split-text-image.png', path: '/page/50', title: 'Split text + image' },
  { file: 'page-51-split-text-image.png', path: '/page/51', title: 'Split text + image' },
  { file: 'page-01-live.png', path: '/page/1?live=1', title: 'Live preview — index' },
];

async function shotPage(page, { file, path: pagePath }) {
  const url = `${BASE}${pagePath}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(2800);
  await page.screenshot({
    path: path.join(OUT_DIR, file),
    type: 'png',
    fullPage: false,
  });
  console.log('✓', file, '←', url);
}

async function shotLocator(page, locator, file) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`No bounding box for ${file}`);
  await page.screenshot({
    path: path.join(OUT_DIR, file),
    type: 'png',
    clip: box,
  });
  console.log('✓', file);
}

async function captureUiStates(page) {
  await page.goto(`${BASE}/page/5`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(2500);

  const toolbar = page.locator('.editor-toolbar');
  await toolbar.waitFor({ timeout: 15000 });
  await shotLocator(page, toolbar, 'ui-toolbar-read.png');

  const hint = page.locator('.report-edit-hint');
  if (await hint.count()) {
    await shotLocator(page, hint, 'ui-edit-hint.png');
  }

  await page.locator('button.edit-toggle').click();
  await sleep(800);
  await shotLocator(page, toolbar, 'ui-toolbar-edit.png');

  await page.locator('button.edit-add').click();
  await page.waitForSelector('.add-page-dialog', { timeout: 15000 });
  await sleep(600);
  const dialog = page.locator('.add-page-dialog');
  await shotLocator(page, dialog, 'ui-add-page-dialog.png');

  const viewMore = page.getByRole('button', { name: /view more/i });
  if (await viewMore.count()) {
    await viewMore.click();
    await sleep(500);
    await shotLocator(page, dialog, 'ui-add-page-more-templates.png');
  }

  await page.keyboard.press('Escape');
}

async function launchBrowser(chromium) {
  const opts = { headless: true, timeout: 300_000 };
  for (const channel of ['msedge', 'chrome', undefined]) {
    try {
      return await chromium.launch(channel ? { ...opts, channel } : opts);
    } catch (err) {
      if (!channel) throw err;
      console.warn(`Launch via ${channel} failed:`, err.message);
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = await import('playwright');
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: VIEWPORT });

  console.log('Capturing report pages...');
  for (const entry of REPORT_PAGES) {
    try {
      await shotPage(page, entry);
    } catch (err) {
      console.warn('✗', entry.file, err.message);
    }
  }

  console.log('\nCapturing editor UI...');
  try {
    await captureUiStates(page);
  } catch (err) {
    console.warn('✗ UI capture', err.message);
  }

  await browser.close();
  console.log(`\nDone. Files in public/guide-screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
