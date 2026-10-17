import { collectFolder, langOf } from './source-files.utils';
import type { SourceFile } from './source-files.utils';

/**
 * The loader of the raw source of every live example, keyed by path. Examples are real components: the code
 * shown next to them is exactly the code that runs. A source is fetched only when a page shows it.
 */
const EXAMPLES = import.meta.glob<string>('../../examples/**/*', { query: '?raw', import: 'default' });

/**
 * The loader of the raw source of every snippet, keyed by path. Snippets are code that is shown but not run:
 * configuration files, or code that does not compile on purpose.
 */
const SNIPPETS = import.meta.glob<string>('../../snippets/**/*', { query: '?raw', import: 'default' });

/**
 * Loads the source files of a live example.
 *
 * @param name - The path of the example folder, relative to `src/examples`, e.g. `signals/overview/counter`.
 * @returns The files of the example, in display order.
 */
export async function loadExampleFiles(name: string): Promise<SourceFile[]> {
  const folder = `../../examples/${name}`;
  const keys = Object.keys(EXAMPLES).filter(key => key.startsWith(`${folder}/`) && !key.endsWith('.spec.ts'));
  const registry: Record<string, string> = {};
  await Promise.all(keys.map(async key => {
    registry[key] = await EXAMPLES[key]();
  }));

  return collectFolder(registry, folder);
}

/**
 * Describes a snippet without its content, which is not loaded yet.
 *
 * @param key - The path of the snippet, relative to `src/snippets`, e.g. `installation/tsconfig.json`.
 * @returns The snippet with its name and language, and no code.
 */
export function describeSnippet(key: string): SourceFile {
  return { name: key.slice(key.lastIndexOf('/') + 1), lang: langOf(key), code: '' };
}

/**
 * Loads a snippet.
 *
 * @param key - The path of the snippet, relative to `src/snippets`, e.g. `installation/tsconfig.json`.
 * @returns The snippet. A missing snippet is reported in place of its content.
 */
export async function loadSnippet(key: string): Promise<SourceFile> {
  const load = SNIPPETS[`../../snippets/${key}`];
  if (!load) {
    console.error(`Missing snippet "${key}"`);
  }

  return { ...describeSnippet(key), code: load ? await load() : `Missing snippet "${key}"` };
}
