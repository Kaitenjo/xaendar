import type { ComponentMetadata, ComponentOrDirectiveMetadata, DirectiveMetadata, TypeCheckResult } from '@xaendar/compiler';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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
    extractDirectivesMetadataFromSourceFile: vi.fn(),
    resolveTemplateSpan: vi.fn()
  };
});

vi.mock('../../registry/metadata-registry/metadata-registry', async (importOriginal) => ({
  getMetadata: vi.fn(),
  // Pure function: the real implementation keys the selectors
  getSelectorKey: (await importOriginal<typeof import('../../registry/metadata-registry/metadata-registry')>()).getSelectorKey,
  getSelectorOwner: vi.fn(),
  registerMetadata: vi.fn(),
  registerSelectors: vi.fn()
}));

import { extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, resolveTemplateSpan } from '@xaendar/compiler';
import MagicString from 'magic-string';
import { createSourceFile, Diagnostic, ScriptKind, ScriptTarget } from 'typescript';
import { getMetadata, getSelectorOwner, registerMetadata, registerSelectors } from '../../registry/metadata-registry/metadata-registry';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, generateStyleModule, generateTemplateModule, getMetadataOrExtract, injectTemplate, parseStyleModuleId, parseTemplateModuleId, resolveModulePath, stripCssComments } from './plugin.utils';
import { Span } from '../../../../../compiler/src/types/span.type';

function createMetadata(selector: string, className = 'Foo', ownerFile = '/src/foo.ts'): ComponentOrDirectiveMetadata {
  return {
    className,
    selector,
    typescriptNodes: { klass: { getSourceFile: () => ({ fileName: ownerFile }) } }
  } as unknown as ComponentOrDirectiveMetadata;
}

function createDirectiveMetadata(selector: string, className = 'FooDirective', ownerFile = '/src/foo.ts'): DirectiveMetadata {
  return {
    ...createMetadata(selector, className, ownerFile),
    type: 'directive'
  } as DirectiveMetadata;
}

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks keeps the implementations: no selector must be owned unless a test says so
  vi.mocked(getSelectorOwner).mockReset();
});

describe('extractImportedComponentPaths()', () => {
  it('returns an empty array when the template has no @import statements', () => {
    expect(extractImportedComponentPaths('<div></div>', '/src/features/user')).toEqual([]);
  });

  it('resolves a single @import path relative to the template directory', () => {
    const template = `@import { Button } from './button.xd.component';\n<my-button></my-button>`;
    const result = extractImportedComponentPaths(template, '/src/features/user');

    expect(result).toEqual([resolvePosixPath('/src/features/user', './button.xd.component')]);
  });

  it('returns posix paths, matching the Vite ids used as registry keys', () => {
    const template = `@import { Button } from './button.xd.component';`;

    expect(extractImportedComponentPaths(template, '/src/features/user')[0]).not.toContain('\\');
  });

  it('resolves every @import path when the template declares multiple imports', () => {
    const template = [
      `@import { Button } from './button.xd.component';`,
      `@import { Input } from '../shared/input.xd.component';`
    ].join('\n');

    const result = extractImportedComponentPaths(template, '/src/features/user');

    expect(result).toEqual([
      resolvePosixPath('/src/features/user', './button.xd.component'),
      resolvePosixPath('/src/features/user', '../shared/input.xd.component')
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

describe('createTemplateModuleSpecifier()', () => {
  it('encodes the template path and the sorted signals', () => {
    expect(createTemplateModuleSpecifier('/src/foo/foo.xd.component.html', ['b', 'a'])).toBe('virtual:xaendar-template:/src/foo/foo.xd.component.html?signals=a,b&lang.js');
  });

  it('normalizes windows path separators', () => {
    expect(createTemplateModuleSpecifier('C:\\src\\foo.xd.component.html', [])).toBe('virtual:xaendar-template:C:/src/foo.xd.component.html?signals=&lang.js');
  });

  it('does not mutate the given signals', () => {
    const signals = ['b', 'a'];
    createTemplateModuleSpecifier('/foo.html', signals);

    expect(signals).toEqual(['b', 'a']);
  });
});

describe('parseTemplateModuleId()', () => {
  it('decodes the template path and the signals of a resolved template module id', () => {
    const id = `\0${createTemplateModuleSpecifier('/src/foo/foo.xd.component.html', ['$count', 'items'])}`;

    expect(parseTemplateModuleId(id)).toEqual({ templatePath: '/src/foo/foo.xd.component.html', signals: ['$count', 'items'] });
  });

  it('decodes an empty signal list', () => {
    expect(parseTemplateModuleId(`\0${createTemplateModuleSpecifier('/foo.html', [])}`)).toEqual({ templatePath: '/foo.html', signals: [] });
  });

  it('returns undefined for ids of other modules', () => {
    expect(parseTemplateModuleId('/src/foo/foo.xd.component.ts')).toBeUndefined();
    expect(parseTemplateModuleId('virtual:xaendar-template:/foo.html?signals=')).toBeUndefined();
  });

  it('returns undefined for a template module id without query', () => {
    expect(parseTemplateModuleId('\0virtual:xaendar-template:/foo.html')).toBeUndefined();
  });
});

describe('generateTemplateModule()', () => {
  it('imports the runtime helpers and exports the render function', () => {
    const code = generateTemplateModule('function render() {}');

    expect(code.startsWith('import { _if, _switch')).toBe(true);
    expect(code).toContain('} from \'@xaendar/core\';\n\nfunction render() {}\n\nexport { render };\n');
  });
});

describe('createStyleModuleSpecifier()', () => {
  it('encodes the style path in the query', () => {
    expect(createStyleModuleSpecifier('/src/foo/foo.css')).toBe('virtual:xaendar-style?path=%2Fsrc%2Ffoo%2Ffoo.css&lang.js');
  });

  it('normalizes windows path separators', () => {
    expect(createStyleModuleSpecifier('C:\\my src\\foo.css')).toBe('virtual:xaendar-style?path=C%3A%2Fmy%20src%2Ffoo.css&lang.js');
  });

  it('does not end the specifier with the style file extension', () => {
    expect(createStyleModuleSpecifier('/foo.css')).not.toMatch(/\.css(?:$|\?)/);
  });
});

describe('parseStyleModuleId()', () => {
  it('decodes the style path of a resolved style module id', () => {
    expect(parseStyleModuleId(`\0${createStyleModuleSpecifier('C:/my src/foo&bar.css')}`)).toBe('C:/my src/foo&bar.css');
  });

  it('returns undefined for ids of other modules', () => {
    expect(parseStyleModuleId('/src/foo/foo.css')).toBeUndefined();
    expect(parseStyleModuleId(`\0${createTemplateModuleSpecifier('/foo.html', [])}`)).toBeUndefined();
    expect(parseStyleModuleId(createStyleModuleSpecifier('/foo.css'))).toBeUndefined();
  });

  it('returns undefined for a style module id without path', () => {
    expect(parseStyleModuleId('\0virtual:xaendar-style?lang.js')).toBeUndefined();
  });
});

describe('generateStyleModule()', () => {
  it('exports the compiled CSS as a stylesheet', () => {
    expect(generateStyleModule('.a { color: red; }')).toBe('const sheet = new CSSStyleSheet();\nsheet.replaceSync(".a { color: red; }");\n\nexport { sheet };\n');
  });

  it('escapes the CSS into a valid string literal', () => {
    const css = '.a::before { content: "`${x}\\\\"; }';
    const code = generateStyleModule(css);

    expect(code).toContain(`sheet.replaceSync(${JSON.stringify(css)});`);
  });

  it('exports an undefined stylesheet when there is no CSS', () => {
    expect(generateStyleModule(undefined)).toBe('export const sheet = undefined;\n');
    expect(generateStyleModule('  \n ')).toBe('export const sheet = undefined;\n');
  });
});

describe('injectTemplate()', () => {
  const jsSource = [
    'class Foo {',
    '  static {',
    '    _initClass();',
    '  }',
    '}'
  ].join('\n');
  const specifier = 'virtual:xaendar-template:/foo.html?signals=&lang.js';
  const styleSpecifier = 'virtual:xaendar-style?path=%2Ffoo.css&lang.js';

  function inject(source: string, first: boolean, className: string, styleModuleSpecifier?: string): string {
    const sourceFile = createSourceFile('component.js', source, ScriptTarget.Latest, true, ScriptKind.JS);
    const s = new MagicString(source);
    const moduleImports = new Map<string, string>(first ? [] : [['virtual:xaendar-template:/other.html?signals=&lang.js', '__Other_render']]);
    injectTemplate(s, sourceFile, moduleImports, className, specifier, styleModuleSpecifier);
    return s.toString();
  }

  it('throws when the target class cannot be found', () => {
    let error: unknown;
    try {
      inject(jsSource, true, 'Missing');
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
      inject(source, true, 'Foo');
    } catch (err) {
      error = err;
    }

    expect(error).toContain('Could not find the static initializer block for class "Foo"');
  });

  it('leaves the source untouched when the static initializer block is missing', () => {
    const source = 'class Foo { }';
    const sourceFile = createSourceFile('component.js', source, ScriptTarget.Latest, true, ScriptKind.JS);
    const s = new MagicString(source);

    expect(() => injectTemplate(s, sourceFile, new Map(), 'Foo', specifier, styleSpecifier)).toThrow();
    expect(s.toString()).toBe(source);
  });

  it('imports the render function from the template module', () => {
    const result = inject(jsSource, false, 'Foo');

    expect(result.startsWith(`import { render as __Foo_render } from ${JSON.stringify(specifier)};\nclass Foo {`)).toBe(true);
  });

  it('registers the render function in a static block before the static initializer block', () => {
    const result = inject(jsSource, false, 'Foo');
    const registration = 'static { _defineRender(this, __Foo_render); }';

    expect(result).toContain(registration);
    expect(result.indexOf('class Foo')).toBeLessThan(result.indexOf(registration));
    expect(result.indexOf(registration)).toBeLessThan(result.indexOf('_initClass()'));
  });

  it('registers the render function before the static block applying the decorators', () => {
    const source = [
      'let _Foo;',
      'class Foo extends Base {',
      '  static {',
      '    [_Foo, _initClass] = _applyDecs2311(this, [WebComponent({ selector: "x-foo" })], [], 0, void 0, Base).c;',
      '  }',
      '  state = signal(true);',
      '  static {',
      '    _initClass();',
      '  }',
      '}'
    ].join('\n');
    const result = inject(source, false, 'Foo');
    const registration = 'static { _defineRender(this, __Foo_render); }';

    expect(result).toContain(`${registration}\n\n  static {\n    [_Foo, _initClass] = _applyDecs2311(`);
    expect(result.indexOf(registration)).toBeLessThan(result.indexOf('_applyDecs2311'));
    expect(result.split('_defineRender(').length).toBe(2);
  });

  it('neither imports nor registers a stylesheet when there is no style module', () => {
    const result = inject(jsSource, false, 'Foo');

    expect(result).not.toContain('sheet');
    expect(result).toContain('static { _defineRender(this, __Foo_render); }');
  });

  it('imports the stylesheet from the style module and registers it along with the render function', () => {
    const result = inject(jsSource, false, 'Foo', styleSpecifier);

    expect(result.startsWith(`import { sheet as __Foo_sheet } from ${JSON.stringify(styleSpecifier)};\nimport { render as __Foo_render }`)).toBe(true);
    expect(result).not.toContain('CSSStyleSheet');
    expect(result).toContain('static { _defineRender(this, __Foo_render, __Foo_sheet); }');
  });

  it('prepends the required runtime imports only on the first component of the file', () => {
    const result = inject(jsSource, true, 'Foo');

    expect(result.startsWith('import { _defineRender } from \'@xaendar/core\';\n')).toBe(true);
  });

  it('does not prepend the required runtime imports when it is not the first component', () => {
    const result = inject(jsSource, false, 'Foo');

    expect(result).not.toContain('_defineRender }');
  });

  describe('with multiple components in the same file', () => {
    const source = [
      'class Foo {',
      '  static { _initClass(); }',
      '}',
      'class Bar {',
      '  static { _initClass2(); }',
      '}'
    ].join('\n');

    function injectBoth(fooSpecifier: string, barSpecifier: string, fooStyleSpecifier?: string, barStyleSpecifier?: string): string {
      const sourceFile = createSourceFile('component.js', source, ScriptTarget.Latest, true, ScriptKind.JS);
      const s = new MagicString(source);
      const moduleImports = new Map<string, string>();

      injectTemplate(s, sourceFile, moduleImports, 'Foo', fooSpecifier, fooStyleSpecifier);
      injectTemplate(s, sourceFile, moduleImports, 'Bar', barSpecifier, barStyleSpecifier);
      return s.toString();
    }

    it('imports a template module shared by several components only once', () => {
      const result = injectBoth(specifier, specifier);

      expect(result.split(JSON.stringify(specifier)).length).toBe(2);
      expect(result).toContain(`import { render as __Foo_render } from ${JSON.stringify(specifier)};`);
      expect(result).not.toContain('__Bar_render');
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { _initClass(); }');
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { _initClass2(); }');
    });

    it('imports each distinct template module of the file', () => {
      const barSpecifier = 'virtual:xaendar-template:/foo.html?signals=count&lang.js';
      const result = injectBoth(specifier, barSpecifier);

      expect(result).toContain(`import { render as __Foo_render } from ${JSON.stringify(specifier)};`);
      expect(result).toContain(`import { render as __Bar_render } from ${JSON.stringify(barSpecifier)};`);
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { _initClass(); }');
      expect(result).toContain('static { _defineRender(this, __Bar_render); }\n\n  static { _initClass2(); }');
    });

    it('prepends the required runtime imports only once', () => {
      const result = injectBoth(specifier, specifier);

      expect(result.startsWith('import { _defineRender } from \'@xaendar/core\';\n')).toBe(true);
      expect(result.split('import { _defineRender }').length).toBe(2);
    });

    it('imports a style module shared by several components only once', () => {
      const result = injectBoth(specifier, specifier, styleSpecifier, styleSpecifier);

      expect(result.split(JSON.stringify(styleSpecifier)).length).toBe(2);
      expect(result).toContain(`import { sheet as __Foo_sheet } from ${JSON.stringify(styleSpecifier)};`);
      expect(result).not.toContain('__Bar_sheet');
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Foo_sheet); }\n\n  static { _initClass2(); }');
    });

    it('imports each distinct style module of the file', () => {
      const barStyleSpecifier = 'virtual:xaendar-style?path=%2Fbar.css&lang.js';
      const result = injectBoth(specifier, specifier, styleSpecifier, barStyleSpecifier);

      expect(result).toContain(`import { sheet as __Foo_sheet } from ${JSON.stringify(styleSpecifier)};`);
      expect(result).toContain(`import { sheet as __Bar_sheet } from ${JSON.stringify(barStyleSpecifier)};`);
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Foo_sheet); }\n\n  static { _initClass(); }');
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Bar_sheet); }\n\n  static { _initClass2(); }');
    });
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
  const resolvedPath = resolvePosixPath('/src', './button');

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

  it('returns a posix path, matching the owner file keys of the metadata registry', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    expect(resolveModulePath('/src', './button')).not.toContain('\\');
  });
});

describe('getMetadataOrExtract()', () => {
  it('returns cached metadata immediately when no path is provided and metadata is already registered', async () => {
    const metadata = createMetadata('my-el');
    vi.mocked(getMetadata).mockReturnValueOnce(metadata);

    const result = await getMetadataOrExtract('Foo');

    expect(result).toBe(metadata);
    expect(getMetadata).toHaveBeenCalledWith('Foo', undefined);
  });

  it('falls back to the ownerless cache lookup when the owner-scoped lookup misses', async () => {
    const metadata = createMetadata('my-el');
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
    const metadata = createMetadata('my-el');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Foo', metadata as unknown as ComponentMetadata]]));

    const result = await getMetadataOrExtract('Foo', '/src/foo.ts');

    expect(result).toBe(metadata);
    expect(registerMetadata).toHaveBeenCalledWith('Foo', metadata);
    expect(getMetadata).toHaveBeenCalledWith('Foo', resolvePosixPath('/src/foo.ts'));
    expect(readFile).toHaveBeenCalledWith(expect.not.stringContaining('\\'), 'utf-8');
  });

  it('resolves an [baseDir, modulePath] tuple via resolveModulePath and claims the selector', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    const resolvedPath = resolvePosixPath('/src', './foo');
    vi.mocked(existsSync).mockImplementation((p) => p === resolvedPath);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    const metadata = createMetadata('my-foo');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Foo', metadata as unknown as ComponentMetadata]]));

    const result = await getMetadataOrExtract('Foo', ['/src', './foo']);

    expect(result).toBe(metadata);
    // The owner file must be posix to match the registry keys (TS source file names)
    expect(getMetadata).toHaveBeenCalledWith('Foo', resolvedPath);
    expect(getMetadata).toHaveBeenCalledWith('Foo', expect.not.stringContaining('\\'));
    // Selectors are owned by a single component, in their own index: they aren't metadata keys
    expect(registerMetadata).toHaveBeenCalledTimes(1);
    expect(registerMetadata).toHaveBeenCalledWith('Foo', metadata);
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
  });

  it('extracts again the metadata of a selector reclaimed by the idle sweep from the file owning it', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(getSelectorOwner).mockImplementation((selector) => selector === 'my-bar' ? { ownerFile: '/src/bar.ts', className: 'Bar' } : undefined);
    vi.mocked(readFile).mockResolvedValue('export class Bar {}');
    const metadata = createMetadata('my-bar', 'Bar', '/src/bar.ts');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Bar', metadata as unknown as ComponentMetadata]]));

    const result = await getMetadataOrExtract('my-bar');

    expect(result).toBe(metadata);
    expect(readFile).toHaveBeenCalledWith('/src/bar.ts', 'utf-8');
    expect(registerMetadata).toHaveBeenCalledWith('Bar', metadata);
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/bar.ts');
  });

  it('throws, registering nothing, when a selector of the extracted component is used by another component', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(getSelectorOwner).mockImplementation((selector) => selector === 'my-foo' ? { ownerFile: '/src/other.ts', className: 'Other' } : undefined);
    const metadata = createMetadata('my-foo');
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockImplementation(async (sourceFile) => sourceFile.fileName === '/src/other.ts'
      ? new Map([['Other', createMetadata('my-foo', 'Other', '/src/other.ts') as unknown as ComponentMetadata]])
      : new Map([['Foo', metadata as unknown as ComponentMetadata]]));

    await expect(getMetadataOrExtract('Foo', '/src/foo.ts')).rejects.toThrow('Selector "my-foo" of component "Foo" - /src/foo.ts is already used by component "Other" - /src/other.ts.');
    expect(registerMetadata).not.toHaveBeenCalled();
    expect(registerSelectors).not.toHaveBeenCalled();
  });

  it('extracts the metadata of a directive when the file declares no component with the requested name', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class FooDirective {}');
    const metadata = createDirectiveMetadata('myFoo');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());
    vi.mocked(extractDirectivesMetadataFromSourceFile).mockResolvedValue(new Map([['FooDirective', metadata]]));

    const result = await getMetadataOrExtract('FooDirective', '/src/foo.ts');

    expect(result).toBe(metadata);
    expect(registerMetadata).toHaveBeenCalledWith('FooDirective', metadata);
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
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

describe('claimSelectors()', () => {
  const OTHER_OWNER = { ownerFile: '/src/other.ts', className: 'Other' };

  function mockOtherFileMetadata(metadatas: Map<string, ComponentMetadata> | undefined) {
    vi.mocked(readFile).mockResolvedValue('export class Other {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(metadatas);
  }

  it('registers the component as the owner of its selector when no other component owns it', async () => {
    const metadata = createMetadata('my-foo');

    expect(await claimSelectors(metadata)).toBeUndefined();
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
    expect(readFile).not.toHaveBeenCalled();
  });

  it('keeps the ownership of a selector already owned by the same component, without reading its file', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue({ ownerFile: '/src/foo.ts', className: 'Foo' });
    const metadata = createMetadata('my-foo');

    expect(await claimSelectors(metadata)).toBeUndefined();
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
    expect(readFile).not.toHaveBeenCalled();
  });

  it('rejects a component without a selector', async () => {
    expect(await claimSelectors(createMetadata(''))).toBe('Component "Foo" - /src/foo.ts does not declare a selector.');
    expect(registerSelectors).not.toHaveBeenCalled();
  });

  it('rejects a selector still declared by the component of another file owning it', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
    mockOtherFileMetadata(new Map([['Other', createMetadata('my-foo', 'Other', '/src/other.ts') as unknown as ComponentMetadata]]));

    const result = await claimSelectors(createMetadata('my-foo'));

    expect(result).toBe('Selector "my-foo" of component "Foo" - /src/foo.ts is already used by component "Other" - /src/other.ts. Custom element names must be unique.');
    expect(readFile).toHaveBeenCalledWith('/src/other.ts', 'utf-8');
    expect(registerSelectors).not.toHaveBeenCalled();
  });

  it('rejects a selector still declared by another component of the same file', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue({ ownerFile: '/src/foo.ts', className: 'Other' });
    mockOtherFileMetadata(new Map([['Other', createMetadata('my-foo', 'Other') as unknown as ComponentMetadata]]));

    const result = await claimSelectors(createMetadata('my-foo'));

    expect(result).toBe('Selector "my-foo" of component "Foo" - /src/foo.ts is already used by component "Other" - /src/foo.ts. Custom element names must be unique.');
    expect(registerSelectors).not.toHaveBeenCalled();
  });

  it('keeps the ownership when the metadata of the owner file cannot be extracted', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
    vi.mocked(readFile).mockResolvedValue('export class Other {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockRejectedValue('boom');

    expect(await claimSelectors(createMetadata('my-foo'))).toContain('is already used by component "Other"');
    expect(registerSelectors).not.toHaveBeenCalled();
  });

  it('replaces a stale ownership whose owner file does not exist anymore', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
    const metadata = createMetadata('my-foo');

    expect(await claimSelectors(metadata)).toBeUndefined();
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
  });

  it.each([
    ['declares no component', undefined],
    ['does not declare the owner class anymore', new Map<string, ComponentMetadata>()],
    ['declares the owner class with another selector', new Map([['Other', createMetadata('x-other', 'Other', '/src/other.ts') as unknown as ComponentMetadata]])]
  ])('replaces a stale ownership whose owner file %s', async (_description, metadatas) => {
    vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
    mockOtherFileMetadata(metadatas);
    const metadata = createMetadata('my-foo');

    expect(await claimSelectors(metadata)).toBeUndefined();
    expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
  });

  describe('directives', () => {
    it('looks up the owner of a directive selector by its template syntax', async () => {
      const metadata = createDirectiveMetadata('my-foo');

      expect(await claimSelectors(metadata)).toBeUndefined();
      expect(getSelectorOwner).toHaveBeenCalledWith('@@my-foo');
      expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
    });

    it('rejects a directive without a selector', async () => {
      expect(await claimSelectors(createDirectiveMetadata(''))).toBe('Directive "FooDirective" - /src/foo.ts does not declare a selector.');
      expect(registerSelectors).not.toHaveBeenCalled();
    });

    it('rejects a selector still declared by the directive of another file owning it', async () => {
      vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
      vi.mocked(readFile).mockResolvedValue('export class Other {}');
      vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());
      vi.mocked(extractDirectivesMetadataFromSourceFile).mockResolvedValue(new Map([['Other', createDirectiveMetadata('myFoo', 'Other', '/src/other.ts')]]));

      const result = await claimSelectors(createDirectiveMetadata('myFoo'));

      expect(result).toBe('Selector "myFoo" of directive "FooDirective" - /src/foo.ts is already used by directive "Other" - /src/other.ts. Directive selectors must be unique.');
      expect(registerSelectors).not.toHaveBeenCalled();
    });

    it('replaces an ownership whose owner class became a component with the same selector', async () => {
      vi.mocked(getSelectorOwner).mockReturnValue(OTHER_OWNER);
      mockOtherFileMetadata(new Map([['Other', createMetadata('myFoo', 'Other', '/src/other.ts') as unknown as ComponentMetadata]]));
      const metadata = createDirectiveMetadata('myFoo');

      expect(await claimSelectors(metadata)).toBeUndefined();
      expect(registerSelectors).toHaveBeenCalledWith(metadata, '/src/foo.ts');
    });
  });
});
