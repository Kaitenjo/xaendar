import { describe, expect, it } from 'vitest';
import type { SymbolImport } from '../../types/imported-symbol/imported-symbol.type';
import { assertImportableSymbol, getRuntimeAlias, toRuntimeImport, toTypeCheckModuleSpecifier } from './symbol-imports.utils';

/**
 * A symbol of `/src/utils.ts` imported as `local`.
 */
const symbol = (imported: string, local = imported): SymbolImport => ({
  type: 'symbol',
  imported,
  local,
  importedSpan: { start: 0, end: imported.length },
  localSpan: { start: 10, end: 10 + local.length },
  modulePath: '/src/utils.ts',
  reactive: false
});

describe('assertImportableSymbol', () => {
  it('accepts any other name', () => {
    expect(() => assertImportableSymbol(symbol('formatDate'))).not.toThrow();
    expect(() => assertImportableSymbol(symbol('_private'))).not.toThrow();
  });

  it.each(['root', '$event', '__probe'])('rejects %s, reserved by the generated code, on the local name', name => {
    expect(() => assertImportableSymbol(symbol('x', name))).toThrow(expect.objectContaining({ message: `"${name}" is reserved in templates: import it under another name (… as name).`, cause: { start: 10, end: 10 + name.length } }));
  });
});

describe('toRuntimeImport', () => {
  it('imports a named, a default and a namespace import under the alias of their local name', () => {
    expect(getRuntimeAlias('format')).toBe('__import_format');
    expect(toRuntimeImport(symbol('formatDate', 'format'))).toBe('import { formatDate as __import_format } from \'/src/utils.ts\';');
    expect(toRuntimeImport(symbol('default', 'fmt'))).toBe('import { default as __import_fmt } from \'/src/utils.ts\';');
    expect(toRuntimeImport(symbol('*', 'utils'))).toBe('import * as __import_utils from \'/src/utils.ts\';');
  });

  it('imports a symbol of a package by the path written in the template', () => {
    const fromPackage = Object.assign(symbol('LIMIT'), { modulePath: '/node_modules/pkg/index.d.ts', importPath: '@scope/pkg' });

    expect(toRuntimeImport(fromPackage)).toBe('import { LIMIT as __import_LIMIT } from \'@scope/pkg\';');
  });
});

describe('toTypeCheckModuleSpecifier', () => {
  it.each([
    ['/src/utils.ts', '/src/utils'],
    ['/src/utils.d.ts', '/src/utils'],
    ['/src/view.tsx', '/src/view'],
    ['/src/esm.mts', '/src/esm'],
    ['/src/legacy.js', '/src/legacy.js']
  ])('drops the TypeScript extension of %s', (modulePath, specifier) => {
    expect(toTypeCheckModuleSpecifier({ modulePath })).toBe(specifier);
  });

  it('imports the module of a package by the path written in the template', () => {
    expect(toTypeCheckModuleSpecifier({ modulePath: '/node_modules/pkg/index.d.mts', importPath: '@scope/pkg' })).toBe('@scope/pkg');
  });
});
