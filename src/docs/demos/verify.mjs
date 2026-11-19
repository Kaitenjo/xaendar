import { Browser } from 'happy-dom';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
  Loads a built demo in a headless DOM and drives it the way a reader would: it checks that the application
  rendered, that the Xaendar element was upgraded, that a value assigned to its input property shows in the
  component, and that a click on the component goes through the state of the application and back into it.

  Usage: node src/docs/demos/verify.mjs <name> [...names]
*/

const SETTLE = 15000;
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain'
};

/**
 * Serves a folder over HTTP, so the demo loads exactly as it does in the iframe of the documentation. The port
 * is chosen by the system, so several runs can go on at the same time.
 *
 * @param root - The folder to serve.
 * @returns The running server.
 */
async function serve(root) {
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(request.url.split('?')[0]);
    const file = join(root, normalize(path.endsWith('/') ? `${path}index.html` : path));
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
}

/**
 * Waits for a promise, and gives up after a while. An application whose runtime keeps a task pending — a
 * prefetch, a poll, an idle callback — would never let the page report itself complete, and what matters here
 * is what the page shows, not that it went idle.
 *
 * @param promise - The promise to wait for.
 * @param ms - How long to wait.
 * @returns Whether the promise settled in time.
 */
function within(promise, ms) {
  let timer;
  const expiry = new Promise(resolve => {
    timer = setTimeout(() => resolve(false), ms);
  });

  return Promise.race([promise.then(() => true, () => false), expiry]).finally(() => clearTimeout(timer));
}

/**
 * Runs one demo and reports what it did.
 *
 * @param name - The name of the demo, i.e. the folder under `src/docs/public/demos`.
 * @returns The report of the run.
 */
async function verify(name) {
  const server = await serve(fileURLToPath(new URL(`../public/demos/${name}/`, import.meta.url)));
  const browser = new Browser({
    settings: {
      enableJavaScriptEvaluation: true,
      enableCSSFileLoading: true,
      disableJavaScriptFileLoading: false,
      suppressInsecureJavaScriptEnvironmentWarning: true
    }
  });

  try {
    const page = browser.newPage();
    const loaded = await within(page.goto(`http://127.0.0.1:${server.address().port}/`), SETTLE);
    const settled = loaded && await within(page.waitUntilComplete(), SETTLE);
    const document = page.mainFrame.document;
    const picker = document.querySelector('ex-qty-picker');
    const quantity = () => picker?.shadowRoot?.querySelector('output')?.textContent ?? null;
    const report = { name, loaded, settled, defined: picker?.constructor?.name !== 'HTMLElement', rendered: quantity() };

    if (picker) {
      picker.value = 5;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    report.afterAssign = quantity();

    picker?.shadowRoot?.querySelectorAll('button')[1]?.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    report.afterClick = quantity();
    // the panel, not the whole body: a framework that streams its state in an inline script would drown it
    const panel = document.querySelector('.panel') ?? document.body;
    report.hostText = panel.textContent.replace(/\s+/g, ' ').trim();
    report.ok = report.defined && report.rendered === '0' && report.afterAssign === '5'
      && report.afterClick === '6' && report.hostText.includes('6');

    return report;
  } finally {
    await within(browser.close(), SETTLE);
    server.close();
  }
}

let failed = false;
for (const name of process.argv.slice(2)) {
  const report = await verify(name);
  failed = failed || !report.ok;
  console.log(`${report.ok ? 'PASS' : 'FAIL'}  ${name}`, JSON.stringify(report));
}

// an application that kept a timer or a request pending would otherwise hold the process open
process.exit(failed ? 1 : 0);
