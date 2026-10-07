import { collectFolder, langOf } from './source-files.utils';
import type { SourceFile } from './source-files.utils';

/**
 * The raw source of every live example, keyed by path. Examples are real components: the code
 * shown next to them is exactly the code that runs.
 */
const EXAMPLES = import.meta.glob<string>('../../examples/**/*', { query: '?raw', import: 'default', eager: true });

/**
 * The raw source of every snippet, keyed by path. Snippets are code that is shown but not run:
 * configuration files, or code that does not compile on purpose.
 */
const SNIPPETS = import.meta.glob<string>('../../snippets/**/*', { query: '?raw', import: 'default', eager: true });

/**
 * Collects the source files of a live example.
 *
 * @param name - The path of the example folder, relative to `src/examples`, e.g. `signals/overview/counter`.
 * @returns The files of the example, in display order.
 */
export function getExampleFiles(name: string): SourceFile[] {
  return collectFolder(EXAMPLES, `../../examples/${name}`);
}

/**
 * Reads a snippet.
 *
 * @param key - The path of the snippet, relative to `src/snippets`, e.g. `installation/tsconfig.json`.
 * @returns The snippet. A missing snippet is reported in place of its content.
 */
export function getSnippet(key: string): SourceFile {
  const code = SNIPPETS[`../../snippets/${key}`];
  if (code === undefined) {
    console.error(`Missing snippet "${key}"`);
  }

  return { name: key.slice(key.lastIndexOf('/') + 1), lang: langOf(key), code: code ?? `Missing snippet "${key}"` };
}
