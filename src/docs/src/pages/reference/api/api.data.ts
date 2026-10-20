import type { PagePath } from '../../../core/routes/routes';
import { API_REFERENCE_PATH } from '../../../core/routes/routes';
import type { SourceFile } from '../../../core/sources/source-files.utils';
import { BUILD_TOOLS_API } from './packages/build-tools.data';
import { COMMON_API } from './packages/common.data';
import { CORE_SIGNALS_API } from './packages/core-signals.data';
import { CORE_API } from './packages/core.data';
import { SIGNALS_API } from './packages/signals.data';
import { TYPES_API } from './packages/types.data';

/**
 * The kinds of documented symbols. `global` is a value installed on `globalThis` rather than exported.
 */
export type ApiKind = 'decorator' | 'class' | 'function' | 'type' | 'global';

/**
 * The groups the members of a symbol are listed in, each under its own heading, in this order.
 */
export type ApiMemberGroup = 'variants' | 'parameters' | 'options' | 'properties' | 'methods';

/**
 * A member of a symbol, described on its own: a variant (`Query.all` of `Query`), a parameter, an option of a
 * configuration object, a property or a method.
 */
export type ApiMember = {
  /**
   * The name of the member: the key of its description in the texts of the symbol.
   */
  readonly name: string;
  /**
   * The group it is listed in.
   */
  readonly group: ApiMemberGroup;
  /**
   * How it is declared or called, in TypeScript.
   */
  readonly signature: string;
  /**
   * The snippets shown below its description: source files exported by a `*.snippets.ts` module, or paths relative to `src/snippets`.
   */
  readonly snippets?: ReadonlyArray<SourceFile | string>;
};

/**
 * A usage note: a titled section of the page of a symbol, with its examples.
 */
export type ApiUsage = {
  /**
   * The key of its title and of its text in the texts of the symbol.
   */
  readonly key: string;
  /**
   * The snippets shown below its text: source files exported by a `*.snippets.ts` module, or paths relative to `src/snippets`.
   */
  readonly snippets?: ReadonlyArray<SourceFile | string>;
};

/**
 * A documented symbol of a package.
 */
export type ApiSymbol = {
  /**
   * The name, as imported. It is the last segment of the path of its page and the key of its texts.
   */
  readonly name: string;
  /**
   * The kind of symbol.
   */
  readonly kind: ApiKind;
  /**
   * Its declaration, in TypeScript.
   */
  readonly signature: string;
  /**
   * The members described on their own.
   */
  readonly members?: readonly ApiMember[];
  /**
   * The usage notes, in order.
   */
  readonly usage?: readonly ApiUsage[];
  /**
   * The guides explaining it.
   */
  readonly guides?: readonly PagePath[];
};

/**
 * The documented packages, and the secondary entry points documented as packages of their own.
 */
export type ApiPackageName = '@xaendar/core' | '@xaendar/core/signals' | '@xaendar/signals' | '@xaendar/build-tools'
  | '@xaendar/common' | '@xaendar/types';

/**
 * A documented package.
 */
export type ApiPackage = {
  /**
   * The name, as imported.
   */
  readonly name: ApiPackageName;
  /**
   * Its symbols. The ones used only by the compiled templates are left out.
   */
  readonly symbols: readonly ApiSymbol[];
};

/**
 * A symbol, with the package exporting it.
 */
export type ApiSymbolEntry = {
  /**
   * The package exporting the symbol.
   */
  readonly apiPackage: ApiPackage;
  /**
   * The symbol.
   */
  readonly symbol: ApiSymbol;
};

/**
 * The texts of a symbol in one language, HTML.
 */
export type ApiSymbolTexts = {
  /**
   * What the symbol is, in one sentence: the lead of its page.
   */
  readonly summary: string;
  /**
   * The full description, in paragraphs.
   */
  readonly description: string;
  /**
   * The description of each member, by name.
   */
  readonly members?: Readonly<Record<string, string>>;
  /**
   * The title and the text of each usage note, by key.
   */
  readonly usage?: Readonly<Record<string, { readonly title: string; readonly body: string }>>;
};

/**
 * The texts of the symbols of a package in one language, by name: the content of `src/i18n/api/<lang>/<package>.json`.
 */
export type ApiPackageTexts = Readonly<Record<string, ApiSymbolTexts>>;

/**
 * Every documented package, in the order of the API reference.
 */
export const API: readonly ApiPackage[] = [CORE_API, CORE_SIGNALS_API, SIGNALS_API, BUILD_TOOLS_API, COMMON_API, TYPES_API];

/**
 * Names the files of a package: its texts (`src/i18n/api/<lang>/<file>.json`) and its snippets
 * (`packages/<file>.snippets.ts`, and the files of `src/snippets/api/<file>/`).
 *
 * @param name - The name of the package.
 * @returns The name without the scope, its slashes replaced by dashes, as in `core-signals`.
 */
export function packageFile(name: ApiPackageName): string {
  return name.slice(name.indexOf('/') + 1).replaceAll('/', '-');
}

/**
 * Builds the path of the page of a symbol, below the API reference, following the import path of its package.
 *
 * @param packageName - The name of the package exporting the symbol.
 * @param symbolName - The name of the symbol.
 * @returns The path, as in `reference/api/core/signals/signal`.
 */
export function symbolPath(packageName: ApiPackageName, symbolName: string): string {
  return `${API_REFERENCE_PATH}/${packageName.slice(packageName.indexOf('/') + 1)}/${symbolName}`;
}

/**
 * Searches the symbols whose name or package contains every word of a query.
 *
 * @param query - The words to search, in any order.
 * @param limit - The maximum number of results.
 * @returns The matching symbols with their packages: the ones named exactly as the query first, then the ones whose
 *   name starts with it, then the others, shorter names first.
 */
export function searchSymbols(query: string, limit = 6): ApiSymbolEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  if (!words.length) {
    return [];
  }

  const text = words.join(' ');
  const scored: Array<ApiSymbolEntry & { rank: number }> = [];
  for (let i = 0; i < API.length; i++) {
    const apiPackage = API[i];
    for (let j = 0; j < apiPackage.symbols.length; j++) {
      const symbol = apiPackage.symbols[j];
      const name = symbol.name.toLowerCase();
      const haystack = `${name} ${apiPackage.name}`;
      if (words.every(word => haystack.includes(word))) {
        scored.push({ apiPackage, symbol, rank: name === text ? 0 : name.startsWith(text) ? 1 : 2 });
      }
    }
  }

  return scored
    .sort((left, right) => left.rank - right.rank || left.symbol.name.length - right.symbol.name.length)
    .slice(0, limit)
    .map(({ apiPackage, symbol }) => ({ apiPackage, symbol }));
}

/**
 * Finds the symbol a page displays.
 *
 * @param path - The path of the page.
 * @returns The symbol with its package, `undefined` if no symbol has that path.
 */
export function findApiSymbol(path: string): ApiSymbolEntry | undefined {
  for (let i = 0; i < API.length; i++) {
    const apiPackage = API[i];
    const symbol = apiPackage.symbols.find(candidate => symbolPath(apiPackage.name, candidate.name) === path);
    if (symbol) {
      return { apiPackage, symbol };
    }
  }

  return undefined;
}
