import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const dirName = import.meta.dirname;
const monorepoRoot = path.resolve(dirName, '../..');

/**
 * The folders of `public` holding applications built apart from the site, with the command that builds them.
 */
const BUILT_APART: Record<string, string> = {
  comparison: 'npm run build:comparison',
  demos: 'npm run build:demos'
};

/**
 * Answers the request of a page of an application built apart from the site (`public/comparison`,
 * `public/demos`) that is not built yet, with a page saying how to build it.
 *
 * Without it the dev server answers a missing page with the `index.html` of the documentation, so the frame
 * showing the application shows the documentation itself, broken, and the console fills with requests for the
 * `main.ts` of a folder that does not exist.
 *
 * @param request - The request.
 * @param response - The response.
 * @param next - Passes the request on to the next middleware.
 */
function answerUnbuilt(request: IncomingMessage, response: ServerResponse, next: () => void): void {
  const pathname = decodeURIComponent((request.url ?? '').split('?')[0]);
  const folder = pathname.split('/')[1];
  const command = Object.hasOwn(BUILT_APART, folder) ? BUILT_APART[folder] : undefined;
  if (!command || !pathname.endsWith('.html') || existsSync(path.join(dirName, 'public', pathname))) {
    next();
    return;
  }

  response.statusCode = 404;
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(`<!doctype html><html><body style="margin:0;display:grid;place-items:center;height:100vh;font:14px/1.5 system-ui,sans-serif;color:#5b6275;background:#f6f7fb"><p>Not built yet: run <code>${command}</code> in <code>src/docs</code>, then reload.</p></body></html>`);
}

/**
 * Adds {@link answerUnbuilt} to the dev server, before its fallback to the `index.html` of the documentation.
 *
 * @returns The plugin.
 */
function unbuiltApplications(): Plugin {
  return {
    name: 'docs-unbuilt-applications',
    configureServer: server => {
      server.middlewares.use(answerUnbuilt);
    }
  };
}

export default defineConfig({
  root: 'src',
  plugins: [unbuiltApplications()],
  publicDir: '../public',
  build: {
    emptyOutDir: true,
    outDir: '../dist/client'
  },
  resolve: {
    alias: [
      { find: /^@xaendar\/common$/, replacement: path.resolve(monorepoRoot, 'packages/common/src/public-api.ts') },
      { find: /^@xaendar\/core$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/public-api.ts') },
      { find: /^@xaendar\/core\/signals$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/signals/index.ts') },
      { find: /^@xaendar\/core\/testing$/, replacement: path.resolve(monorepoRoot, 'packages/core/src/testing/index.ts') },
      { find: /^@xaendar\/internals$/, replacement: path.resolve(monorepoRoot, 'packages/internals/src/public-api.ts') },
      { find: /^@xaendar\/directives$/, replacement: path.resolve(monorepoRoot, 'packages/directives/src/public-api.ts') },
      { find: /^@xaendar\/forms$/, replacement: path.resolve(monorepoRoot, 'packages/forms/src/public-api.ts') },
      { find: /^@xaendar\/ssr$/, replacement: path.resolve(monorepoRoot, 'packages/ssr/src/public-api') },
      { find: /^@xaendar\/ssr\/dom$/, replacement: path.resolve(monorepoRoot, 'packages/ssr/src/dom/index') },
      { find: /^@xaendar\/signals$/, replacement: path.resolve(monorepoRoot, 'packages/signals/src/public-api.ts') },
      { find: /^@xaendar\/types$/, replacement: path.resolve(monorepoRoot, 'packages/types/src/public-api.ts') },
    ]
  },
  server: {
    open: true,
    port: 4200,
    fs: {
      allow: [monorepoRoot]
    },
    forwardConsole: false
  }
});