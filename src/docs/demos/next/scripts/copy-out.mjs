import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
  Next.js always exports to `out/`, which the root .gitignore of the repository ignores along with `.next/`.
  What ships is the copy under src/docs/public/demos/next, so the build script runs this step right after the
  export: it replaces that folder with the freshly exported one, minus the legacy polyfill bundle.

  That bundle is the `<script nomodule>` Next.js adds to every page: no browser that supports modules ever runs
  it, so no browser that can run a custom element runs it either, and the headless check of this demo
  (src/docs/demos/verify.mjs) does run it, because its DOM ignores `nomodule` — and fetches it synchronously,
  from the very process that serves it, which deadlocks. Dropping the tag costs the demo nothing and makes it
  checkable. There is no configuration flag for it: the plugin that emits it is unconditional.
*/

const LEGACY_POLYFILL = /<script[^>]*\bnomodule\b[^>]*>\s*<\/script>/gi;

const source = fileURLToPath(new URL('../out/', import.meta.url));
const target = fileURLToPath(new URL('../../../public/demos/next/', import.meta.url));

/**
 * Removes the `<script nomodule>` tag from every exported page.
 *
 * @param folder - The folder to walk.
 * @returns The number of pages that were rewritten.
 */
async function dropLegacyPolyfill(folder) {
  let rewritten = 0;
  const entries = await readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      rewritten += await dropLegacyPolyfill(path);
    } else if (entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      const stripped = html.replace(LEGACY_POLYFILL, '');
      if (stripped !== html) {
        await writeFile(path, stripped);
        rewritten++;
      }
    }
  }

  return rewritten;
}

/**
 * Removes the legacy polyfill bundle itself, which nothing references once its tag is gone. It is committed
 * with the rest of the export, so leaving 112 KB of dead code in the repository would be a waste.
 *
 * @param folder - The folder holding the chunks of the export.
 * @returns The names of the files that were removed.
 */
async function dropLegacyChunks(folder) {
  const names = (await readdir(folder)).filter(name => name.startsWith('polyfills-') && name.endsWith('.js'));
  for (const name of names) {
    await rm(join(folder, name));
  }

  return names;
}

await rm(target, { force: true, recursive: true });
await cp(source, target, { recursive: true });
const rewritten = await dropLegacyPolyfill(target);
const removed = await dropLegacyChunks(join(target, '_next', 'static', 'chunks'));

console.log(`copied ${source} -> ${target}`);
console.log(`dropped the legacy polyfill from ${rewritten} pages, and ${removed.length} chunk(s): ${removed}`);
