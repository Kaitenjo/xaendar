import type { SymbolImport } from '../../types/symbol-import.type';

/**
 * The names a template cannot import a symbol as, besides the ones starting with `__`, which the generated code uses:
 * the component the type-check reads its members from, and the event of an event binding.
 */
const RESERVED_NAMES: ReadonlySet<string> = new Set(['root', '$event']);

/**
 * Ensures a template can import a symbol under its local name: the generated code uses `root`, `$event` and the
 * names starting with `__` for itself.
 *
 * @param symbol - The imported symbol.
 * @throws If the local name is reserved.
 */
export function assertImportableSymbol({ local, localSpan }: SymbolImport): void {
  if (RESERVED_NAMES.has(local) || local.startsWith('__')) {
    throw new Error(`"${local}" is reserved in templates: import it under another name (… as name).`, { cause: localSpan });
  }
}

/**
 * Returns the name the render code imports a symbol of the template as: the module-level functions and the locals of
 * the render code would otherwise shadow it.
 *
 * @example
 * getRuntimeAlias('formatDate');  // '__import_formatDate'
 *
 * @param local - The name the template imports the symbol as.
 * @returns The alias of the symbol in the render code.
 */
export function getRuntimeAlias(local: string): string {
  return `__import_${local}`;
}

/**
 * Writes the import declaration of a symbol of the template in the render code, under its alias (see {@link getRuntimeAlias}).
 *
 * @example
 * toRuntimeImport({ imported: 'formatDate', local: 'format', modulePath: '/src/format.ts', … });  // "import { formatDate as __import_format } from '/src/format.ts';"
 * toRuntimeImport({ imported: 'LIMIT', local: 'LIMIT', importPath: '@scope/pkg', … });             // "import { LIMIT as __import_LIMIT } from '@scope/pkg';"
 *
 * @param symbol - The imported symbol.
 * @returns The import declaration.
 */
export function toRuntimeImport({ imported, local, modulePath, importPath = modulePath }: SymbolImport): string {
  const alias = getRuntimeAlias(local);
  return imported === '*' ? `import * as ${alias} from '${importPath}';` : `import { ${imported} as ${alias} } from '${importPath}';`;
}

/**
 * Returns the specifier the type-check code imports the module of a symbol with: the path of a package as written in
 * the `@import`, resolved like the imports of the project, or the path of a file of the project without the
 * TypeScript extension, which TypeScript resolves without `allowImportingTsExtensions`.
 *
 * @example
 * toTypeCheckModuleSpecifier({ modulePath: '/src/format.ts', … });                                 // '/src/format'
 * toTypeCheckModuleSpecifier({ modulePath: '/node_modules/pkg/index.d.ts', importPath: 'pkg', … }); // 'pkg'
 *
 * @param symbol - The imported symbol.
 * @returns The module specifier.
 */
export function toTypeCheckModuleSpecifier({ modulePath, importPath }: Pick<SymbolImport, 'modulePath' | 'importPath'>): string {
  return importPath ?? modulePath.replace(/(?:\.d)?\.[cm]?tsx?$/, '');
}
