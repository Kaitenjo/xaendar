import type { CodeLang } from '../highlight/highlight';

/**
 * A source file shown in the documentation.
 */
export type SourceFile = {
  /**
   * The path of the file, relative to the folder it was collected from.
   */
  readonly name: string;
  /**
   * The language of the file, used to highlight it.
   */
  readonly lang: CodeLang;
  /**
   * The content of the file.
   */
  readonly code: string;
};

/**
 * Infers the language of a file from its extension.
 *
 * @param fileName - The name of the file.
 * @returns The language of the file, `text` when the extension is unknown.
 */
export function langOf(fileName: string): CodeLang {
  const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
  switch (extension) {
    case 'ts':
    case 'js':
    case 'mjs':
      return 'ts';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'sh':
      return 'bash';
    default:
      return 'text';
  }
}

/**
 * Ranks a file within its component: class, then template, then style, then anything else.
 *
 * @param fileName - The name of the file.
 * @returns The rank of the file, lower first.
 */
function rankOf(fileName: string): number {
  if (fileName.endsWith('.xd.component.ts')) {
    return 0;
  }
  if (fileName.endsWith('.html')) {
    return 1;
  }
  if (fileName.endsWith('.css')) {
    return 2;
  }
  return 3;
}

/**
 * Collects the files of a folder out of a registry of raw files, as produced by an
 * `import.meta.glob` with the `?raw` query.
 *
 * Files are grouped by their base name (the part before the first dot): the group named after
 * the folder comes first, the others follow in alphabetical order. Within a group, the class
 * comes first, then the template, the style and anything else.
 *
 * @param registry - The raw files, keyed by path.
 * @param folder - The path of the folder, as used in the keys of the registry, without a trailing slash.
 * @returns The files of the folder and its sub folders, specs excluded.
 */
export function collectFolder(registry: Readonly<Record<string, string>>, folder: string): SourceFile[] {
  const prefix = `${folder}/`;
  const main = folder.slice(folder.lastIndexOf('/') + 1);
  const baseOf = (name: string) => {
    const fileName = name.slice(name.lastIndexOf('/') + 1);
    return fileName.slice(0, fileName.indexOf('.'));
  };

  return Object.keys(registry)
    .filter(key => key.startsWith(prefix) && !key.endsWith('.spec.ts'))
    .map(key => {
      const name = key.slice(prefix.length);
      return { name, lang: langOf(name), code: registry[key] ?? '' };
    })
    .sort((a, b) => {
      const baseA = baseOf(a.name);
      const baseB = baseOf(b.name);
      if (baseA !== baseB) {
        return baseA === main ? -1 : baseB === main ? 1 : baseA.localeCompare(baseB);
      }
      return rankOf(a.name) - rankOf(b.name) || a.name.localeCompare(b.name);
    });
}
