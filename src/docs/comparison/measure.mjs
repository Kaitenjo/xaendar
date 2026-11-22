import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

/*
  Measures the three pages of the framework comparison, built into ../public/comparison (`npm run build:comparison`),
  as the documentation reports them: each page alone, in a new browser context (no cache, nothing else running), the
  same number of times, keeping the median of every figure. Requires Playwright, not a dependency of the site
  (`npm install --no-save playwright` in src/docs), and its Chromium (`npx playwright install chromium`).

  Usage: node comparison/measure.mjs [--runs=10] [--json=<file>]

  The documentation page shows src/pages/reference/framework-comparison/framework-comparison.results.json: write it
  with --json=src/pages/reference/framework-comparison/framework-comparison.results.json (from src/docs).
*/

/**
 * The pages measured, by the folder of their build.
 */
const FRAMEWORKS = ['angular', 'react', 'xaendar'];

/**
 * The CPU throttling rates the pages are measured with: the machine as it is, and four times slower, as a mid-range
 * phone is.
 */
const THROTTLING_RATES = [1, 4];

/**
 * The folder holding the builds of the pages.
 */
const BUILDS = resolve(import.meta.dirname, '../public/comparison');

/**
 * The content types of the files the pages load.
 */
const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/**
 * The department the filter applies, one of `DEPARTMENTS` of `shared/data.ts`.
 */
const DEPARTMENT = 'Engineering';

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const runs = Number(args.runs ?? 10);
const { chromium } = createRequire(import.meta.url)('playwright');

/**
 * Code run in every page before its own: records the time of the first frame showing the 1,000 rows of the table,
 * and defines the helpers the measures call. The elements are searched through the shadow roots too, where the
 * Xaendar components render.
 */
const PAGE_HELPERS = () => {
  const all = (root, selector, found = []) => {
    found.push(...root.querySelectorAll(selector));
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) {
        all(element.shadowRoot, selector, found);
      }
    }

    return found;
  };
  const rows = () => all(document, 'tbody tr').length;
  const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  window.__measure = {
    rows,
    elements: () => all(document, '*').length,
    // Time from the click to the first painted frame showing a table of another number of rows
    click: async label => {
      const before = rows();
      // The button of the page, or the component wrapping it, which the page listens to
      const button = all(document, 'button, ui-button').find(element => element.textContent.trim() === label);
      const start = performance.now();
      button.click();
      do {
        await nextPaint();
      } while (rows() === before);
      return performance.now() - start;
    },
    select: (option, value) => {
      const select = all(document, 'select').find(element => [...element.options].some(item => item.value === option));
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  };
  const poll = () => rows() >= 1000 ? window.__startup = performance.now() : requestAnimationFrame(poll);
  requestAnimationFrame(poll);
};

/**
 * Serves the builds of the pages.
 *
 * @returns The server, listening on a free port.
 */
function serve() {
  const server = createServer((request, response) => {
    const path = join(BUILDS, decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    try {
      const body = readFileSync(path);
      response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  return new Promise(resolve => server.listen(0, () => resolve(server)));
}

/**
 * Measures the JavaScript of a page: its files, as they are and compressed with gzip.
 *
 * @param framework - The folder of the build of the page.
 * @returns The sizes, in bytes.
 */
function measureScripts(framework) {
  const files = [];
  const collect = folder => {
    for (const name of readdirSync(folder)) {
      const path = join(folder, name);
      statSync(path).isDirectory() ? collect(path) : name.endsWith('.js') && files.push(readFileSync(path));
    }
  };
  collect(join(BUILDS, framework));
  return {
    raw: files.reduce((sum, file) => sum + file.length, 0),
    gzip: files.reduce((sum, file) => sum + gzipSync(file, { level: 9 }).length, 0)
  };
}

/**
 * Loads a page once, in a new browser context, and measures it.
 *
 * @param browser - The browser.
 * @param url - The address of the page.
 * @param rate - The CPU throttling rate.
 * @returns The figures of the run.
 */
async function measureRun(browser, url, rate) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.addInitScript(PAGE_HELPERS);
  await page.goto(url);
  await page.waitForFunction(() => window.__startup !== undefined, undefined, { timeout: 60000 });
  const startup = await page.evaluate(() => window.__startup);
  const elements = await page.evaluate(() => window.__measure.elements());
  await cdp.send('HeapProfiler.collectGarbage');
  const { usedSize } = await cdp.send('Runtime.getHeapUsage');
  const { nodes, jsEventListeners } = await cdp.send('Memory.getDOMCounters');
  await page.evaluate(department => window.__measure.select(department, department), DEPARTMENT);
  const filter = await page.evaluate(() => window.__measure.click('Apply'));
  const filtered = await page.evaluate(() => window.__measure.rows());
  const reset = await page.evaluate(() => window.__measure.click('Reset'));
  await context.close();
  return { startup, elements, heap: usedSize, nodes, listeners: jsEventListeners, filter, filtered, reset };
}

/**
 * Gives the median of some values.
 *
 * @param values - The values.
 * @returns The median.
 */
function median(values) {
  const sorted = values.slice().sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const server = await serve();
const browser = await chromium.launch();
const machine = `${cpus()[0].model.trim()}, ${cpus().length} cores`;
const results = { date: new Date().toISOString().slice(0, 10), browser: `Chromium ${browser.version()}`, machine, runs, pages: {} };
try {
  for (const framework of FRAMEWORKS) {
    results.pages[framework] = { scripts: measureScripts(framework) };
  }

  for (const rate of THROTTLING_RATES) {
    const measured = Object.fromEntries(FRAMEWORKS.map(framework => [framework, []]));
    // The runs of the pages alternate with one another's, so that a slower moment of the machine weighs on all of them
    for (let i = 0; i < runs; i++) {
      for (const framework of FRAMEWORKS) {
        measured[framework].push(await measureRun(browser, `http://localhost:${server.address().port}/${framework}/index.html`, rate));
      }
    }

    for (const framework of FRAMEWORKS) {
      const figures = {};
      for (const key of Object.keys(measured[framework][0])) {
        figures[key] = Math.round(median(measured[framework].map(run => run[key])) * 10) / 10;
      }

      results.pages[framework][`cpu${rate}x`] = figures;
      console.log(framework, `cpu ${rate}x`, JSON.stringify(figures));
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (args.json) {
  writeFileSync(args.json, `${JSON.stringify(results, null, 2)}\n`);
}

console.log(JSON.stringify(results, null, 2));
