import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import { LANGS } from '../../../core/router/route-hash.utils';
import type { ApiPackageName, ApiPackageTexts, ApiSymbol } from './api.data';
import { API, findApiSymbol, packageFile, searchSymbols, symbolPath } from './api.data';

/**
 * The entry point of each documented package, relative to the root of the repository.
 */
const ENTRY_POINTS: Readonly<Record<ApiPackageName, string>> = {
  '@xaendar/core': 'packages/core/src/public-api.ts',
  '@xaendar/core/signals': 'packages/core/src/signals/index.ts',
  '@xaendar/signals': 'packages/signals/src/public-api.ts',
  '@xaendar/build-tools': 'packages/build-tools/src/public-api.ts',
  '@xaendar/common': 'packages/common/src/public-api.ts',
  '@xaendar/types': 'packages/types/src/public-api.ts'
};

/**
 * The exports used only by the compiled templates that are not prefixed with `_`: left out of the reference.
 */
const INTERNAL_EXPORTS: ReadonlySet<string> = new Set(['mountNode', 'createAnchor', 'RenderFunction', 'RenderDefinition']);

/**
 * Finds the root of the repository, walking up from the working directory.
 *
 * @returns The absolute path of the root.
 * @throws When no ancestor contains the packages.
 */
function findRepositoryRoot(): string {
  let directory = ts.sys.getCurrentDirectory();
  while (!ts.sys.fileExists(`${directory}/${ENTRY_POINTS['@xaendar/core']}`)) {
    const parent = ts.sys.resolvePath(`${directory}/..`);
    if (parent === directory) {
      throw new Error('Unable to find the root of the repository');
    }
    directory = parent;
  }
  return directory;
}

/**
 * Lists the names exported by a module, following its re-exports.
 *
 * @param file - The absolute path of the module.
 * @returns The exported names.
 */
function exportsOf(file: string): string[] {
  const program = ts.createProgram([file], { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(file);
  const symbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  return symbol ? checker.getExportsOfModule(symbol).map(exported => exported.getName()) : [];
}

/**
 * Reads the texts of a package in a language.
 *
 * @param root - The root of the repository.
 * @param lang - The language.
 * @param name - The name of the package.
 * @returns The texts of its symbols.
 */
function textsOf(root: string, lang: string, name: ApiPackageName): ApiPackageTexts {
  return JSON.parse(ts.sys.readFile(`${root}/src/docs/src/i18n/api/${lang}/${packageFile(name)}.json`) ?? '{}');
}

/**
 * Lists the snippets shown on the page of a symbol.
 *
 * @param symbol - The symbol.
 * @returns The paths of the snippets of its members and of its usage notes.
 */
function snippetsOf({ members, usage }: ApiSymbol): string[] {
  const snippets: string[] = [];
  if (members?.length) {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (member.snippets?.length) {
        snippets.push(...member.snippets);
      }
    }
  }
  if (usage?.length) {
    for (let i = 0; i < usage.length; i++) {
      const note = usage[i];
      if (note.snippets?.length) {
        snippets.push(...note.snippets);
      }
    }
  }
  return snippets;
}

describe.each(API.map(apiPackage => [apiPackage.name, apiPackage] as const))('API reference of %s', (name, apiPackage) => {
  const root = findRepositoryRoot();

  it('documents every export, and nothing else', () => {
    const exported = exportsOf(`${root}/${ENTRY_POINTS[name]}`).filter(exportName => !exportName.startsWith('_') && !INTERNAL_EXPORTS.has(exportName));
    const documented = apiPackage.symbols.filter(symbol => symbol.kind !== 'global').map(symbol => symbol.name);

    expect(exported.length).toBeGreaterThan(0);
    expect(documented.sort()).toEqual(exported.sort());
  });

  it('names the symbols and the members of a symbol once', () => {
    const names = apiPackage.symbols.map(symbol => symbol.name);
    expect(new Set(names).size).toBe(names.length);
    for (let i = 0; i < apiPackage.symbols.length; i++) {
      const members = apiPackage.symbols[i].members?.map(member => member.name);
      expect(new Set(members).size, apiPackage.symbols[i].name).toBe(members?.length ?? 0);
    }
  });

  it.each(LANGS)('describes every symbol, member and usage note in %s, and nothing else', lang => {
    const texts = textsOf(root, lang, name);
    expect(Object.keys(texts).sort()).toEqual(apiPackage.symbols.map(symbol => symbol.name).sort());
    for (let i = 0; i < apiPackage.symbols.length; i++) {
      const symbol = apiPackage.symbols[i];
      const { summary, description, members, usage } = texts[symbol.name];
      expect(summary.trim(), symbol.name).not.toBe('');
      expect(description.trim(), symbol.name).not.toBe('');
      expect(members && Object.keys(members).sort(), symbol.name).toEqual(symbol.members?.map(member => member.name).sort());
      expect(usage && Object.keys(usage).sort(), symbol.name).toEqual(symbol.usage?.map(note => note.key).sort());
      if (members) {
        for (const [member, text] of Object.entries(members)) {
          expect(text.trim(), `${symbol.name}.${member}`).not.toBe('');
        }
      }
      if (usage) {
        for (const [key, note] of Object.entries(usage)) {
          expect(note.title.trim(), `${symbol.name} ${key}`).not.toBe('');
          expect(note.body.trim(), `${symbol.name} ${key}`).not.toBe('');
        }
      }
    }
  });

  it('shows only existing snippets and links only existing guides', () => {
    for (let i = 0; i < apiPackage.symbols.length; i++) {
      const symbol = apiPackage.symbols[i];
      const snippets = snippetsOf(symbol);
      for (let j = 0; j < snippets.length; j++) {
        expect(ts.sys.fileExists(`${root}/src/docs/src/snippets/${snippets[j]}`), snippets[j]).toBe(true);
      }
      const guides = symbol.guides;
      if (guides?.length) {
        for (let j = 0; j < guides.length; j++) {
          expect(PAGES.some(page => page.path === guides[j]), guides[j]).toBe(true);
        }
      }
    }
  });

  it.each(LANGS)('links only existing pages of the reference from the texts in %s, in that language', lang => {
    const paths = new Set(API.flatMap(other => other.symbols.map(symbol => symbolPath(other.name, symbol.name))));
    const links = JSON.stringify(textsOf(root, lang, name)).matchAll(/#\/(\w+)\/(reference\/api\/[^"\\]+)/g);
    for (const [link, linkLang, path] of links) {
      expect(linkLang, link).toBe(lang);
      expect(paths.has(path), link).toBe(true);
    }
  });
});

describe('links to the API reference', () => {
  const root = findRepositoryRoot();
  const paths = new Set(API.flatMap(apiPackage => apiPackage.symbols.map(symbol => symbolPath(apiPackage.name, symbol.name))));

  it.each(LANGS)('point from the messages in %s to existing symbols, in that language', lang => {
    const links = (ts.sys.readFile(`${root}/src/docs/src/i18n/${lang}.json`) ?? '').matchAll(/#\/(\w+)\/(reference\/api\/[^"\\]+)/g);
    for (const [link, linkLang, path] of links) {
      expect(linkLang, link).toBe(lang);
      expect(paths.has(path), link).toBe(true);
    }
  });

  it('point from the templates of the pages to existing symbols', () => {
    const templates = ts.sys.readDirectory(`${root}/src/docs/src/pages`, ['.html']);
    for (let i = 0; i < templates.length; i++) {
      const links = (ts.sys.readFile(templates[i]) ?? '').matchAll(/\/(reference\/api\/[^`"]+)`/g);
      for (const [, path] of links) {
        expect(paths.has(path), `${templates[i]}: ${path}`).toBe(true);
      }
    }
  });
});

describe('symbolPath', () => {
  it('follows the import path of the package', () => {
    expect(symbolPath('@xaendar/core', 'WebComponent')).toBe('reference/api/core/WebComponent');
    expect(symbolPath('@xaendar/core/signals', 'signal')).toBe('reference/api/core/signals/signal');
  });
});

describe('packageFile', () => {
  it('drops the scope and replaces the slashes', () => {
    expect(packageFile('@xaendar/build-tools')).toBe('build-tools');
    expect(packageFile('@xaendar/core/signals')).toBe('core-signals');
  });
});

describe('searchSymbols', () => {
  it('returns nothing for a blank query', () => {
    expect(searchSymbols('  ')).toEqual([]);
  });

  it('ranks the exact name first, then the names starting with the query, shorter first', () => {
    const names = searchSymbols('signal', 20).map(entry => entry.symbol.name);
    expect(names.slice(0, 2).sort()).toEqual(['Signal', 'signal']);
    expect(names.indexOf('SignalEqual')).toBeLessThan(names.indexOf('InputSignal'));
  });

  it('matches every word, in the name or in the package', () => {
    const entries = searchSymbols('query core/signals', 20);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(entry => entry.apiPackage.name === '@xaendar/core/signals' && /query/i.test(entry.symbol.name))).toBe(true);
  });

  it('limits the results', () => {
    expect(searchSymbols('e', 3)).toHaveLength(3);
  });
});

describe('findApiSymbol', () => {
  it('finds a symbol by the path of its page', () => {
    const entry = findApiSymbol('reference/api/core/WebComponent');
    expect(entry?.apiPackage.name).toBe('@xaendar/core');
    expect(entry?.symbol.name).toBe('WebComponent');
  });

  it('returns undefined for unknown symbols and packages', () => {
    expect(findApiSymbol('reference/api/core/Nope')).toBeUndefined();
    expect(findApiSymbol('reference/api/nope/WebComponent')).toBeUndefined();
    expect(findApiSymbol('reference/api')).toBeUndefined();
  });
});
