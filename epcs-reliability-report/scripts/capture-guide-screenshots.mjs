/**
 * Captures real UI screenshots from a running preview server.
 * Run: npm run build && npm run capture-guide-screenshots
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'guide-screenshots');
const BASE = 'http://127.0.0.1:4173';
const VIEWPORT = { width: 1440, height: 900 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(500);
  }
  throw new Error(`Preview server did not start at ${BASE}`);
}

function startPreview() {
  return spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: ROOT,
    shell: true,
    stdio: 'ignore',
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const preview = startPreview();
  try {
    await waitForServer();

    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    const shot = async (file, opts = {}) => {
      const filePath = path.join(OUT_DIR, file);
      await page.screenshot({ path: filePath, type: 'png', ...opts });
      console.log('  ✓', file);
    };

    console.log('Capturing UI screenshots...');

    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90000 });
    await sleep(800);
    await shot('01-home-cover.png', { fullPage: false });

    await page.goto(`${BASE}/page/1`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('.editor-toolbar, .report-shell', { timeout: 30000 });
    await sleep(600);
    await shot('02-index-read-mode.png');

    const toolbar = page.locator('.editor-toolbar');
    if (await toolbar.count()) {
      await shot('03-navigation-toolbar-read.png', { clip: await toolbar.first().boundingBox() });
    }

    await page.goto(`${BASE}/page/9`, { waitUntil: 'networkidle', timeout: 90000 });
    await sleep(600);
    await shot('04-image-page-read.png');

    await page.goto(`${BASE}/page/13`, { waitUntil: 'networkidle', timeout: 90000 });
    await sleep(600);
    await shot('05-split-links-image-read.png');

    await page.goto(`${BASE}/page/5`, { waitUntil: 'networkidle', timeout: 90000 });
    await sleep(400);
    await page.locator('button.edit-toggle').click();
    await sleep(700);
    if (await toolbar.count()) {
      await shot('06-toolbar-edit-mode.png', { clip: await toolbar.first().boundingBox() });
    }
    await shot('07-table-edit-mode.png');

    await page.locator('button.edit-add').click();
    await page.waitForSelector('.add-page-dialog', { timeout: 15000 });
    await sleep(500);
    const dialog = page.locator('.add-page-dialog');
    await shot('08-add-page-dialog.png', { clip: await dialog.boundingBox() });

    const viewMore = page.getByRole('button', { name: /view more/i });
    if (await viewMore.count()) {
      await viewMore.click();
      await sleep(500);
      await shot('09-add-page-all-templates.png', { clip: await dialog.boundingBox() });
    }

    await page.keyboard.press('Escape');
    await sleep(400);

    await page.goto(`${BASE}/page/9`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.locator('button.edit-toggle').click();
    await sleep(800);
    await shot('10-image-page-edit-resize.png');

    await page.goto(`${BASE}/page/1?live=1`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('.legacy-live-nav, .pdf-viewer-nav', { timeout: 30000 });
    await sleep(600);
    await shot('11-live-preview-index.png');

    // Chart editor: add page (creates draft) then capture editor UI
    await page.goto(`${BASE}/page/5`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.locator('button.edit-toggle').click();
    await sleep(500);
    await page.locator('button.edit-add').click();
    await page.waitForSelector('.add-page-dialog', { timeout: 15000 });
    const viewMore2 = page.getByRole('button', { name: /view more/i });
    if (await viewMore2.count()) await viewMore2.click();
    await sleep(400);
    const chartCard = page.locator('.template-card').filter({ hasText: 'Charts from data' });
    if (await chartCard.count()) {
      await chartCard.first().click();
      await sleep(2000);
      const chartEditor = page.locator('.chart-editor');
      if (await chartEditor.count()) {
        await shot('12-chart-editor.png', { clip: await chartEditor.first().boundingBox() });
      }
    }

    await browser.close();
    console.log(`\nDone. Screenshots saved to public/guide-screenshots/`);
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
