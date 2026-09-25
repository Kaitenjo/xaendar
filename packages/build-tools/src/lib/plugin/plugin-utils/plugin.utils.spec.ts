import type { ComponentMetadata, ComponentOrDirectiveMetadata, TypeCheckResult } from '@xaendar/compiler';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn()
}));

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    extractComponentsMetadataFromSourceFile: vi.fn(),
    resolveTemplateSpan: vi.fn()
  };
});

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  getMetadata: vi.fn(),
  registerMetadata: vi.fn()
}));

import { extractComponentsMetadataFromSourceFile, resolveTemplateSpan } from '@xaendar/compiler';
import { Diagnostic } from 'typescript';
import { getMetadata, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { describeDiagnostic, extractImportedComponentPaths, getMetadataOrExtract, injectFunctions, resolveModulePath, stripCssComments } from './plugin.utils';
import { Span } from '../../../../../compiler/src/types/span.type';

function createMetadata(selectors: string[]): ComponentOrDirectiveMetadata {
  return { selectors } as unknown as ComponentOrDirectiveMetadata;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractImportedComponentPaths()', () => {
  it('returns an empty array when the template has no @import statements', () => {
    expect(extractImportedComponentPaths('<div></div>', '/src/features/user')).toEqual([]);
  });

  it('resolves a single @import path relative to the template directory', () => {
    const template = `@import { Button } from './button.xd.component';\n<my-button></my-button>`;
    const result = extractImportedComponentPaths(template, '/src/features/user');

    expect(result).toEqual([resolve('/src/features/user', './button.xd.component')]);
  });

  it('resolves every @import path when the template declares multiple imports', () => {
    const template = [
      `@import { Button } from './button.xd.component';`,
      `@import { Input } from '../shared/input.xd.component';`
    ].join('\n');

    const result = extractImportedComponentPaths(template, '/src/features/user');

    expect(result).toEqual([
      resolve('/src/features/user', './button.xd.component'),
      resolve('/src/features/user', '../shared/input.xd.component')
    ]);
  });
});

describe('stripCssComments()', () => {
  it('removes block comments from the stylesheet', () => {
    expect(stripCssComments('/* c */.a{color:red;}/* d */')).toBe('.a{color:red;}');
  });

  it('returns the input unchanged when there are no comments', () => {
    expect(stripCssComments('.a{color:red;}')).toBe('.a{color:red;}');
  });
});

describe('injectFunctions()', () => {
  const jsSource = [
    'class Foo {',
    '  static {',
    '    _initClass();',
    '  }',
    '}'
  ].join('\n');

  it('throws when the target class cannot be found', () => {
    let error: unknown;
    try {
      injectFunctions(jsSource, true, '/* methods */', 'Missing');
    } catch (err) {
      error = err;
    }

    expect(error).toBe('Could not find class "Missing" in the transpiled output.');
  });

  it('throws when the decorator static initializer block is missing', () => {
    const source = [
      'class Foo {',
      '  bar = 1;',
      '  static { }',
      '  static { doA(); doB(); }',
      '  static { const x = 1; }',
      '  static { _initClass(1); }',
      '  static { doSomethingElse(); }',
      '}'
    ].join('\n');

    let error: unknown;
    try {
      injectFunctions(source, true, '/* methods */', 'Foo');
    } catch (err) {
      error = err;
    }

    expect(error).toContain('Could not find the static initializer block for class "Foo"');
  });

  it('inserts the compiled template methods before the static initializer block', () => {
    const result = injectFunctions(jsSource, false, '/* METHODS */', 'Foo');

    expect(result.indexOf('/* METHODS */')).toBeLessThan(result.indexOf('_initClass()'));
  });

  it('does not insert a style snippet when there is no CSS content', () => {
    const result = injectFunctions(jsSource, false, '/* methods */', 'Foo');

    expect(result).not.toContain('CSSStyleSheet');
  });

  it('does not insert a style snippet when the CSS content is blank', () => {
    const result = injectFunctions(jsSource, false, '/* methods */', 'Foo', '__sheet', '   ');

    expect(result).not.toContain('CSSStyleSheet');
  });

  it('inserts the style snippet before the class declaration when CSS content is provided', () => {
    const result = injectFunctions(jsSource, false, '/* methods */', 'Foo', '__Foo_sheet', '.a { color: red; }');

    expect(result).toContain('const __Foo_sheet = new CSSStyleSheet();');
    expect(result).toContain('__Foo_sheet.replaceSync(`.a { color: red; }`);');
    expect(result.indexOf('__Foo_sheet.replaceSync')).toBeLessThan(result.indexOf('class Foo'));
  });

  it('doubles backslashes in the injected CSS payload', () => {
    const result = injectFunctions(jsSource, false, '/* methods */', 'Foo', '__Foo_sheet', 'a\\b');

    expect(result).toContain('a\\\\b');
  });

  it('prepends the required runtime imports only on the first component of the file', () => {
    const result = injectFunctions(jsSource, true, '/* methods */', 'Foo');

    expect(result.startsWith("import { _if, _switch")).toBe(true);
  });

  it('does not prepend the required runtime imports when it is not the first component', () => {
    const result = injectFunctions(jsSource, false, '/* methods */', 'Foo');

    expect(result.startsWith('import {')).toBe(false);
  });
});

describe('describeDiagnostic()', () => {
  const templateSource = 'line one\nline two\nline three';
  const mappingTable: TypeCheckResult['mappingTable'] = new Map();

  it('returns the raw message when the diagnostic has no source file', () => {
    const diagnostic = { messageText: 'Something went wrong', file: undefined, start: 5 } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, mappingTable)).toBe('Something went wrong');
  });

  it('returns the raw message when the diagnostic has no start position', () => {
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn() },
      start: undefined
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, mappingTable)).toBe('Something went wrong');
  });

  it('extracts the nested messageText when messageText is a diagnostic chain', () => {
    const diagnostic = {
      messageText: { messageText: 'Chained message' },
      file: undefined,
      start: 5
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, mappingTable)).toBe('Chained message');
  });

  it('returns the raw message when the mapped body line is negative', () => {
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 1, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 5, mappingTable)).toBe('Something went wrong');
  });

  it('returns the raw message when the template span cannot be resolved', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue(undefined);
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 1, mappingTable)).toBe('Something went wrong');
  });

  it('formats the diagnostic with the resolved template position and source snippet', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 0, end: 4 } as unknown as Span);
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    const result = describeDiagnostic(templateSource, diagnostic, 1, mappingTable);

    expect(result).toBe('[Ln 1, Col 1] - Something went wrong\n ---> line');
  });
});

describe('resolveModulePath()', () => {
  const resolvedPath = resolve('/src', './button');

  it('returns the resolved path unchanged when it already exists as-is', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === resolvedPath);

    expect(resolveModulePath('/src', './button')).toBe(resolvedPath);
  });

  it('appends a .ts extension when the bare path does not exist but the .ts file does', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === `${resolvedPath}.ts`);

    expect(resolveModulePath('/src', './button')).toBe(`${resolvedPath}.ts`);
  });

  it('appends /index.ts when the path is a directory containing an index file', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === `${resolvedPath}/index.ts`);

    expect(resolveModulePath('/src', './button')).toBe(`${resolvedPath}/index.ts`);
  });

  it('returns undefined when no candidate path exists', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(resolveModulePath('/src', './button')).toBeUndefined();
  });

  it('returns undefined for package (non-relative) import specifiers', () => {
    expect(resolveModulePath('/src', '@scope/pkg')).toBeUndefined();
  });
});

describe('getMetadataOrExtract()', () => {
  it('returns cached metadata immediately when no path is provided and metadata is already registered', async () => {
    const metadata = createMetadata(['my-el']);
    vi.mocked(getMetadata).mockReturnValueOnce(metadata);

    const result = await getMetadataOrExtract('Foo');

    expect(result).toBe(metadata);
    expect(getMetadata).toHaveBeenCalledWith('Foo', undefined);
  });

  it('falls back to the ownerless cache lookup when the owner-scoped lookup misses', async () => {
    const metadata = createMetadata(['my-el']);
    vi.mocked(getMetadata).mockReturnValueOnce(undefined).mockReturnValueOnce(metadata);

    const result = await getMetadataOrExtract('Foo', '/src/foo.ts');

    expect(result).toBe(metadata);
  });

  it('throws when metadata is missing and no path was provided to resolve it', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);

    await expect(getMetadataOrExtract('Foo')).rejects.toThrow('Unable to resolve module path for "Foo".');
  });

  it('resolves a string path directly with node:path resolve semantics', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    const metadata = createMetadata([]);
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Foo', metadata as unknown as ComponentMetadata]]));

    const result = await getMetadataOrExtract('Foo', '/src/foo.ts');

    expect(result).toBe(metadata);
    expect(registerMetadata).toHaveBeenCalledWith('Foo', metadata);
  });

  it('resolves an [baseDir, modulePath] tuple via resolveModulePath and registers every selector', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    const resolvedPath = resolve('/src', './foo');
    vi.mocked(existsSync).mockImplementation((p) => p === resolvedPath);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    const metadata = createMetadata(['my-foo', 'x-foo']);
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Foo', metadata as unknown as ComponentMetadata]]));

    const result = await getMetadataOrExtract('Foo', ['/src', './foo']);

    expect(result).toBe(metadata);
    expect(registerMetadata).toHaveBeenCalledWith('Foo', metadata);
    expect(registerMetadata).toHaveBeenCalledWith('my-foo', metadata);
    expect(registerMetadata).toHaveBeenCalledWith('x-foo', metadata);
  });

  it('throws when the extracted metadata map has no entry for the requested symbol', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());

    await expect(getMetadataOrExtract('Foo', '/src/foo.ts')).rejects.toThrow('Metadata for symbol "Foo" not found.');
  });

  it('throws when extraction yields no map at all', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(undefined);

    await expect(getMetadataOrExtract('Foo', '/src/foo.ts')).rejects.toThrow('Metadata for symbol "Foo" not found.');
  });
});
