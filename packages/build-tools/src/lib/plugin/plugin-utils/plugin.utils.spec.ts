import type { ComponentMetadata, ComponentOrDirectiveMetadata, DirectiveMetadata, LibraryComponentMetadata, TypeCheckResult } from '@xaendar/compiler';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
    isReactiveExport: vi.fn(),
    readLibraryMetadata: vi.fn(),
    resolveExportedClass: vi.fn(),
    resolveTemplateSpan: vi.fn()
  };
});

vi.mock('../../registry/metadata-registry/metadata-registry', async (importOriginal) => ({
  getLibrarySelectorOwner: vi.fn(),
  getMetadata: vi.fn(),
  // Pure function: the real implementation keys the selectors
  getSelectorKey: (await importOriginal<typeof import('../../registry/metadata-registry/metadata-registry')>()).getSelectorKey,
  getSelectorOwner: vi.fn(),
  registerMetadata: vi.fn(),
  registerSelectors: vi.fn()
}));

import { ASTNodeType, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, type ImportedSymbol, type ImportNode, isReactiveExport, parseTemplate, readLibraryMetadata, resolveExportedClass, resolveTemplateSpan } from '@xaendar/compiler';
import MagicString from 'magic-string';
import { type CompilerOptions, createProgram, createSourceFile, Diagnostic, ModuleKind, ModuleResolutionKind, ScriptKind, ScriptTarget } from 'typescript';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { getLibrarySelectorOwner, getMetadata, getSelectorOwner, registerMetadata, registerSelectors } from '../../registry/metadata-registry/metadata-registry';
import { resolvePosixPath, toPosixPath } from '../../utils/path/path.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, describeEventCheckDiagnostic, describeTemplateWarning, extractImportedComponentPaths, generateServerStyleModule, generateServerTemplateModule, generateStaticModule, generateStyleModule, generateTemplateModule, getImportOrExtract, getMetadataOrExtract, injectTemplate, parseStyleModuleId, parseTemplateModuleId, resolveTemplateModules, stripCssComments } from './plugin.utils';
import { Span } from '../../../../../compiler/src/types/span.type';

function createMetadata(selector: string, className = 'Foo', ownerFile = '/src/foo.ts'): ComponentOrDirectiveMetadata {
  return {
    className,
    selector,
    modulePath: ownerFile
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

  it('resolves the path of a module written without its extension, like TypeScript does', () => {
    const resolved = resolvePosixPath('/src/features/user', './utils.ts');
    vi.mocked(existsSync).mockImplementation(path => path === resolved);

    expect(extractImportedComponentPaths('@import { formatDate } from \'./utils\';', '/src/features/user')).toEqual([resolved]);
  });

  it('resolves the modules of an @import lazy too', () => {
    const template = `@import lazy { Panel } from './panel.xd.component';\n@import { Button } from './button.xd.component';`;
    const panel = resolvePosixPath('/src/features/user', './panel.xd.component');
    const button = resolvePosixPath('/src/features/user', './button.xd.component');

    expect(extractImportedComponentPaths(template, '/src/features/user')).toEqual([panel, button]);
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

  it('encodes the sorted shadowing members only when there are any', () => {
    expect(createTemplateModuleSpecifier('/foo.html', ['count'], ['name', 'Math'])).toBe('virtual:xaendar-template:/foo.html?signals=count&shadowing=Math,name&lang.js');
    expect(createTemplateModuleSpecifier('/foo.html', ['count'], [])).toBe('virtual:xaendar-template:/foo.html?signals=count&lang.js');
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

    expect(parseTemplateModuleId(id)).toEqual({ templatePath: '/src/foo/foo.xd.component.html', signals: ['$count', 'items'], shadowingMembers: [] });
  });

  it('decodes an empty signal list', () => {
    expect(parseTemplateModuleId(`\0${createTemplateModuleSpecifier('/foo.html', [])}`)).toEqual({ templatePath: '/foo.html', signals: [], shadowingMembers: [] });
  });

  it('decodes the shadowing members', () => {
    expect(parseTemplateModuleId(`\0${createTemplateModuleSpecifier('/foo.html', [], ['name'])}`)).toEqual({ templatePath: '/foo.html', signals: [], shadowingMembers: ['name'] });
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

  it('imports only helpers @xaendar/core exports, the specs of the generators evaluating the code without its imports', () => {
    const imported = /import \{ (.*) \} from '@xaendar\/core';/.exec(generateTemplateModule('function render() {}'))![1].split(', ');
    const publicApi = resolvePosixPath(join(process.cwd(), 'packages/core/src/public-api.ts'));
    const program = createProgram([publicApi], { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, target: ScriptTarget.ESNext, noEmit: true });
    const checker = program.getTypeChecker();
    const exported = new Set(checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(publicApi)!)!).map(({ name }) => name));

    expect(exported.has('_renderElement') && exported.has('CustomElement')).toBe(true);
    expect(imported.filter(name => !exported.has(name))).toEqual([]);
  }, 60000);

  it('imports the dependencies of the template for their side effects, before the runtime helpers', () => {
    const code = generateTemplateModule('function render() {}', ['/src/a.xd.component.ts', 'C:/my src/b.xd.component.ts']);

    expect(code.startsWith('import "/src/a.xd.component.ts";\nimport "C:/my src/b.xd.component.ts";\nimport { _if')).toBe(true);
  });

  it('leaves out the dependencies the compiled code imports dynamically, which a @hydrate loads in chunks of their own', () => {
    const compiled = 'function render() { _hydrate(root, context, null, { load: () => Promise.all([import("C:/my src/b.xd.component.ts"), import("/src/c.xd.component.ts")]) }); }';
    const code = generateTemplateModule(compiled, ['/src/a.xd.component.ts', 'C:/my src/b.xd.component.ts', '/src/c.xd.component.ts']);

    expect(code.startsWith('import "/src/a.xd.component.ts";\nimport { _if')).toBe(true);
    expect(code).toContain('_hydrate, _client, _try, _defer, ');
    expect(code).toContain(compiled);
  });
});

describe('generateStaticModule()', () => {
  it('imports the modules of the components a static one renders', () => {
    expect(generateStaticModule(['/src/a.xd.component.ts', '/src/b.xd.component.ts'])).toBe('import "/src/a.xd.component.ts";\nimport "/src/b.xd.component.ts";\nexport {};\n');
  });

  it('is an empty module for a component rendering no other one', () => {
    expect(generateStaticModule([])).toBe('export {};\n');
  });
});

describe('createStyleModuleSpecifier()', () => {
  it('carries the style path in the query', () => {
    expect(createStyleModuleSpecifier('/src/foo/foo.css')).toBe('virtual:xaendar-style?path=/src/foo/foo.css&lang.js');
  });

  it('normalizes windows path separators', () => {
    expect(createStyleModuleSpecifier('C:\\my src\\foo.css')).toBe('virtual:xaendar-style?path=C:/my src/foo.css&lang.js');
  });

  it('keeps the path unchanged by the URL decoding of the dev server', () => {
    const specifier = createStyleModuleSpecifier('C:/my src/foo.css');
    expect(decodeURI(specifier)).toBe(specifier);
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

  it('returns undefined for a style module id without the lang.js flag', () => {
    expect(parseStyleModuleId('\0virtual:xaendar-style?path=/foo.css')).toBeUndefined();
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

describe('generateServerTemplateModule()', () => {
  it('imports the dependencies of the template first, then exports the render function of the code compiled for the server', () => {
    const code = generateServerTemplateModule('import { _Context } from \'@xaendar/core\';\nfunction render(out) {}', ['/src/a.xd.component.ts']);

    expect(code).toBe('import "/src/a.xd.component.ts";\nimport { _Context } from \'@xaendar/core\';\nfunction render(out) {}\n\nexport { render };\n');
  });

  it('imports nothing else for a template without dependencies', () => {
    expect(generateServerTemplateModule('function render(out) {}')).toBe('function render(out) {}\n\nexport { render };\n');
  });
});

describe('generateServerStyleModule()', () => {
  it('exports the compiled CSS as a string literal', () => {
    const css = '.a::before { content: "</style>"; }';

    expect(generateServerStyleModule(css)).toBe(`export const css = ${JSON.stringify(css)};\n`);
  });

  it('exports an undefined text when there is no CSS', () => {
    expect(generateServerStyleModule(undefined)).toBe('export const css = undefined;\n');
    expect(generateServerStyleModule('  \n ')).toBe('export const css = undefined;\n');
  });
});

describe('injectTemplate()', () => {
  const jsSource = [
    'class Foo extends Base {',
    '  static {',
    '    [_Foo, _initClass] = _applyDecs(this, [WebComponent({ selector: "x-foo" })], [], 0, void 0, Base).c;',
    '  }',
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
    injectTemplate(s, sourceFile, moduleImports, className, specifier, CLIENT_STRATEGY.registration, styleModuleSpecifier);
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

  it('throws when no class of that name has the static block applying its decorators', () => {
    const source = [
      'class Foo {',
      '  bar = 1;',
      '  static { }',
      '  static { _initClass(); }',
      '  static { const x = 1; }',
      '  static { _applyDecs(this, []); }',
      '  static { x += _applyDecs(this, []); }',
      '  static { [_Foo] = _applyDecs(other, []).c; }',
      '  static { [_Foo] = _applyDecs().c; }',
      '  static { [_Foo] = helpers.applyDecs(this, []).c; }',
      '  static { [_Foo] = _decorate(this, []).c; }',
      '  static { [_Foo] = _applyDecs(this, []).c; doMore(); }',
      '  static { class Inner { static { [_Inner] = _applyDecs(this, []).c; } } }',
      '}'
    ].join('\n');

    let error: unknown;
    try {
      inject(source, true, 'Foo');
    } catch (err) {
      error = err;
    }

    expect(error).toContain('Could not find the static block applying the decorators of class "Foo"');
  });

  it('leaves the source untouched when the static initializer block is missing', () => {
    const source = 'class Foo { }';
    const sourceFile = createSourceFile('component.js', source, ScriptTarget.Latest, true, ScriptKind.JS);
    const s = new MagicString(source);

    expect(() => injectTemplate(s, sourceFile, new Map(), 'Foo', specifier, CLIENT_STRATEGY.registration, styleSpecifier)).toThrow();
    expect(s.toString()).toBe(source);
  });

  it('imports the render function from the template module', () => {
    const result = inject(jsSource, false, 'Foo');

    expect(result.startsWith(`import { render as __Foo_render } from ${JSON.stringify(specifier)};\nclass Foo extends Base {`)).toBe(true);
  });

  it('registers the modules compiled for the server via _defineServerRender of @xaendar/ssr, importing the text of the stylesheet', () => {
    const sourceFile = createSourceFile('component.js', jsSource, ScriptTarget.Latest, true, ScriptKind.JS);
    const s = new MagicString(jsSource);

    injectTemplate(s, sourceFile, new Map(), 'Foo', specifier, SERVER_STRATEGY.registration, styleSpecifier);
    const result = s.toString();

    expect(result.startsWith([
      'import { _defineServerRender } from \'@xaendar/ssr\';',
      `import { css as __Foo_css } from ${JSON.stringify(styleSpecifier)};`,
      `import { render as __Foo_render } from ${JSON.stringify(specifier)};`
    ].join('\n'))).toBe(true);
    expect(result).toContain('static { _defineServerRender(this, __Foo_render, __Foo_css); }');
    expect(result).not.toContain('_defineRender');
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

  it('recognizes the static block applying both class and member decorators', () => {
    const source = [
      'class Foo extends Base {',
      '  static {',
      '    ({',
      '      e: [_init_items, _init_extra_items],',
      '      c: [_Foo, _initClass]',
      '    } = _applyDecs(this, [WebComponent({ selector: "x-foo" })], [[Property(), 1, "items"]], 0, void 0, Base));',
      '  }',
      '  #A = _init_items(this);',
      '}'
    ].join('\n');
    const result = inject(source, false, 'Foo');

    expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static {\n    ({');
  });

  it('finds a class babel nests in a wrapper class, as it does when the class has static fields', () => {
    const source = [
      'let _Foo;',
      'new class extends _identity {',
      '  static [class Foo extends Base {',
      '    static {',
      '      [_Foo, _initClass] = _applyDecs(this, [WebComponent({ selector: "x-foo" })], [], 0, void 0, Base).c;',
      '    }',
      '  }];',
      '  observedAttributes = ["disabled"];',
      '  constructor() {',
      '    super(_Foo), _initClass();',
      '  }',
      '}();',
      'export { _Foo as Foo };'
    ].join('\n');
    const result = inject(source, false, 'Foo');

    expect(result).toContain('static [class Foo extends Base {\n    static { _defineRender(this, __Foo_render); }\n\n  static {\n      [_Foo, _initClass] = _applyDecs(');
    expect(result.split('_defineRender(').length).toBe(2);
  });

  it('skips the classes of that name that do not apply decorators', () => {
    const source = [
      'function helper() {',
      '  return class Foo { static { _initClass(); } };',
      '}',
      jsSource
    ].join('\n');
    const result = inject(source, false, 'Foo');

    expect(result).toContain('return class Foo { static { _initClass(); } };');
    expect(result).toContain('class Foo extends Base {\n  static { _defineRender(this, __Foo_render); }\n\n  static {\n    [_Foo, _initClass] = _applyDecs(');
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
      '  static { [_Foo, _initClass] = _applyDecs(this, [], []).c; }',
      '}',
      'class Bar {',
      '  static { [_Bar, _initClass2] = _applyDecs(this, [], []).c; }',
      '}'
    ].join('\n');

    function injectBoth(fooSpecifier: string, barSpecifier: string, fooStyleSpecifier?: string, barStyleSpecifier?: string): string {
      const sourceFile = createSourceFile('component.js', source, ScriptTarget.Latest, true, ScriptKind.JS);
      const s = new MagicString(source);
      const moduleImports = new Map<string, string>();

      injectTemplate(s, sourceFile, moduleImports, 'Foo', fooSpecifier, CLIENT_STRATEGY.registration, fooStyleSpecifier);
      injectTemplate(s, sourceFile, moduleImports, 'Bar', barSpecifier, CLIENT_STRATEGY.registration, barStyleSpecifier);
      return s.toString();
    }

    it('imports a template module shared by several components only once', () => {
      const result = injectBoth(specifier, specifier);

      expect(result.split(JSON.stringify(specifier)).length).toBe(2);
      expect(result).toContain(`import { render as __Foo_render } from ${JSON.stringify(specifier)};`);
      expect(result).not.toContain('__Bar_render');
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { [_Foo, _initClass]');
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { [_Bar, _initClass2]');
    });

    it('imports each distinct template module of the file', () => {
      const barSpecifier = 'virtual:xaendar-template:/foo.html?signals=count&lang.js';
      const result = injectBoth(specifier, barSpecifier);

      expect(result).toContain(`import { render as __Foo_render } from ${JSON.stringify(specifier)};`);
      expect(result).toContain(`import { render as __Bar_render } from ${JSON.stringify(barSpecifier)};`);
      expect(result).toContain('static { _defineRender(this, __Foo_render); }\n\n  static { [_Foo, _initClass]');
      expect(result).toContain('static { _defineRender(this, __Bar_render); }\n\n  static { [_Bar, _initClass2]');
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
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Foo_sheet); }\n\n  static { [_Bar, _initClass2]');
    });

    it('imports each distinct style module of the file', () => {
      const barStyleSpecifier = 'virtual:xaendar-style?path=%2Fbar.css&lang.js';
      const result = injectBoth(specifier, specifier, styleSpecifier, barStyleSpecifier);

      expect(result).toContain(`import { sheet as __Foo_sheet } from ${JSON.stringify(styleSpecifier)};`);
      expect(result).toContain(`import { sheet as __Bar_sheet } from ${JSON.stringify(barStyleSpecifier)};`);
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Foo_sheet); }\n\n  static { [_Foo, _initClass]');
      expect(result).toContain('static { _defineRender(this, __Foo_render, __Bar_sheet); }\n\n  static { [_Bar, _initClass2]');
    });
  });
});

describe('describeTemplateWarning()', () => {
  it('prefixes the message with the position of the warning, and follows it with the text it is reported on', () => {
    expect(describeTemplateWarning('<p></p>\n{ document }', { span: { start: 10, end: 18 }, message: 'Careful' })).toBe('[Ln 2, Col 3] - Careful\n ---> document');
  });
});

describe('describeDiagnostic()', () => {
  const templateSource = 'line one\nline two\nline three';
  const typeCheck: Pick<TypeCheckResult, 'mappingTable' | 'variableCalls'> = { mappingTable: new Map() };

  it('returns the raw message when the diagnostic has no source file', () => {
    const diagnostic = { messageText: 'Something went wrong', file: undefined, start: 5 } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, typeCheck)).toBe('Something went wrong');
  });

  it('returns the raw message when the diagnostic has no start position', () => {
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn() },
      start: undefined
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, typeCheck)).toBe('Something went wrong');
  });

  it('extracts the nested messageText when messageText is a diagnostic chain', () => {
    const diagnostic = {
      messageText: { messageText: 'Chained message' },
      file: undefined,
      start: 5
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 0, typeCheck)).toBe('Chained message');
  });

  it('returns the raw message when the mapped body line is negative', () => {
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 1, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 5, typeCheck)).toBe('Something went wrong');
  });

  it('returns the raw message when the template span cannot be resolved', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue(undefined);
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    expect(describeDiagnostic(templateSource, diagnostic, 1, typeCheck)).toBe('Something went wrong');
  });

  it('formats the diagnostic with the resolved template position and source snippet', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 0, end: 4 } as unknown as Span);
    const diagnostic = {
      messageText: 'Something went wrong',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    const result = describeDiagnostic(templateSource, diagnostic, 1, typeCheck);

    expect(result).toBe('[Ln 1, Col 1] - Something went wrong\n ---> line');
  });

  it('tells that a variable of the template called while its value is not a function is not a signal', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 0, end: 4 } as unknown as Span);
    const diagnostic = {
      code: 2349,
      messageText: 'This expression is not callable.',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    const result = describeDiagnostic(templateSource, diagnostic, 1, { mappingTable: new Map(), variableCalls: [{ name: 'line', span: { start: 0, end: 4 } }] });

    expect(result).toBe('[Ln 1, Col 1] - \'line\' is a template variable, not a signal: remove the parentheses and read it as line, since the variables of a template (@for, @let, parameters of a template) hold their values\n ---> line');
  });

  it('names the values the cases of a @switch ending with @default never; leave uncovered', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 0, end: 4 } as unknown as Span);
    const diagnostic = {
      code: 1360,
      messageText: 'Type \'"error"\' does not satisfy the expected type \'never\'.',
      file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 3 }) },
      start: 10
    } as unknown as Diagnostic;

    const result = describeDiagnostic(templateSource, diagnostic, 1, { mappingTable: new Map(), exhaustiveSwitches: [{ start: 0, end: 4 }] });

    expect(result).toBe('[Ln 1, Col 1] - @switch is not exhaustive: no @case covers "error". Add the missing @case, or replace @default never; with a @default branch.\n ---> line');
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

  it('extracts the metadata with the given compiler options, which resolve the base classes', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class FooDirective {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());
    vi.mocked(extractDirectivesMetadataFromSourceFile).mockResolvedValue(new Map([['FooDirective', createDirectiveMetadata('myFoo')]]));
    const compilerOptions = { baseUrl: '/src' };

    await getMetadataOrExtract('FooDirective', '/src/foo.ts', compilerOptions);

    expect(extractComponentsMetadataFromSourceFile).toHaveBeenCalledWith(expect.anything(), compilerOptions);
    expect(extractDirectivesMetadataFromSourceFile).toHaveBeenCalledWith(expect.anything(), compilerOptions);
  });

  it('throws when the extracted metadata map has no entry for the requested symbol', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());

    await expect(getMetadataOrExtract('Foo', '/src/foo.ts')).rejects.toThrow(`Class "Foo" was not found in the import from ${resolvePosixPath('/src/foo.ts')}`);
  });

  it('throws when extraction yields no map at all', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(undefined);

    await expect(getMetadataOrExtract('Foo', '/src/foo.ts')).rejects.toThrow(`Class "Foo" was not found in the import from ${resolvePosixPath('/src/foo.ts')}`);
  });

  it('names the import module path when the symbol is not found in a file resolved from a [baseDir, modulePath] tuple', async () => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    const resolvedPath = resolvePosixPath('/src', './foo');
    vi.mocked(existsSync).mockImplementation((p) => p === resolvedPath);
    vi.mocked(readFile).mockResolvedValue('export class Foo {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());

    await expect(getMetadataOrExtract('Foo', ['/src', './foo'])).rejects.toThrow('Class "Foo" was not found in the import from ./foo');
  });
});

describe('getImportOrExtract()', () => {
  const modulePath = resolvePosixPath('/src', './utils.ts');

  beforeEach(() => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(existsSync).mockImplementation(path => path === modulePath);
    vi.mocked(readFile).mockResolvedValue('export const x = 1;');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(undefined);
    vi.mocked(extractDirectivesMetadataFromSourceFile).mockResolvedValue(undefined);
  });

  it('throws when the module cannot be resolved', async () => {
    await expect(getImportOrExtract('x', 'x', '/src', './missing')).rejects.toThrow('Unable to resolve module path "./missing" for "x".');
  });

  it('returns the metadata of a component or directive registered or declared in the module, the default one by its local name', async () => {
    const registered = createMetadata('my-el');
    vi.mocked(getMetadata).mockReturnValueOnce(registered);
    expect(await getImportOrExtract('Foo', 'Foo', '/src', './utils')).toBe(registered);

    const declared = createMetadata('my-bar', 'Bar');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Bar', declared as unknown as ComponentMetadata]]));
    expect(await getImportOrExtract('default', 'Bar', '/src', './utils')).toBe(declared);
    expect(registerMetadata).toHaveBeenCalledWith('Bar', declared);
  });

  it('returns any other export as a symbol of the module, reactive when it reads a signal', async () => {
    vi.mocked(isReactiveExport).mockImplementation((_path, name) => name === 'count');

    expect(await getImportOrExtract('count', 'count', '/src', './utils', { baseUrl: '/src' })).toEqual({ type: 'symbol', modulePath, reactive: true });
    expect(await getImportOrExtract('format', 'fmt', '/src', './utils')).toEqual({ type: 'symbol', modulePath, reactive: false });
    expect(isReactiveExport).toHaveBeenCalledWith(modulePath, 'count', { baseUrl: '/src' });
  });

  it('returns a namespace import as a reactive symbol of the module, without analyzing it', async () => {
    expect(await getImportOrExtract('*', 'utils', '/src', './utils')).toEqual({ type: 'symbol', modulePath, reactive: true });
    expect(readFile).not.toHaveBeenCalled();
    expect(isReactiveExport).not.toHaveBeenCalled();
  });

  it('reads a component or a directive the module re-exports from the file declaring it, registering it', async () => {
    const declared = createMetadata('my-card', 'CardComponent', '/src/card/card.xd.component.ts');
    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: '/src/card/card.xd.component.ts' }, declaration: { name: { text: 'CardComponent' } } } as never);
    vi.mocked(extractComponentsMetadataFromSourceFile).mockImplementation(async sourceFile => (sourceFile.fileName === '/src/card/card.xd.component.ts' ? new Map([['CardComponent', declared as unknown as ComponentMetadata]]) : undefined));

    expect(await getImportOrExtract('Card', 'Card', '/src', './utils', { baseUrl: '/src' })).toBe(declared);
    expect(resolveExportedClass).toHaveBeenCalledWith(modulePath, 'Card', { baseUrl: '/src' });
    expect(readFile).toHaveBeenCalledWith('/src/card/card.xd.component.ts', 'utf-8');
    expect(registerMetadata).toHaveBeenCalledWith('CardComponent', declared);
  });

  it('returns the registered metadata of a re-exported class, and reads a class the module exports under another name', async () => {
    const registered = createMetadata('my-card', 'CardComponent', '/src/card/card.xd.component.ts');
    vi.mocked(getMetadata).mockImplementation((name, path) => (name === 'CardComponent' && path === '/src/card/card.xd.component.ts' ? registered : undefined));
    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: '/src/card/card.xd.component.ts' }, declaration: { name: { text: 'CardComponent' } } } as never);

    expect(await getImportOrExtract('Card', 'Card', '/src', './utils')).toBe(registered);
    expect(readFile).not.toHaveBeenCalledWith('/src/card/card.xd.component.ts', 'utf-8');

    const aliased = createMetadata('my-tile', 'Tile');
    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: modulePath }, declaration: { name: { text: 'Tile' } } } as never);
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Tile', aliased as unknown as ComponentMetadata]]));
    expect(await getImportOrExtract('Board', 'Board', '/src', './utils')).toBe(aliased);
  });

  it('returns a symbol when the module exports no component nor directive under the name', async () => {
    const symbol = { type: 'symbol', modulePath, reactive: false };
    vi.mocked(isReactiveExport).mockReturnValue(false);
    vi.mocked(resolveExportedClass).mockReturnValueOnce(undefined);
    expect(await getImportOrExtract('Plain', 'Plain', '/src', './utils')).toEqual(symbol);

    // The class the module declares itself was looked for already
    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: modulePath }, declaration: { name: { text: 'Plain' } } } as never);
    expect(await getImportOrExtract('Plain', 'Plain', '/src', './utils')).toEqual(symbol);
    expect(readFile).toHaveBeenCalledTimes(2);

    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: '/node_modules/acme/index.d.ts' }, declaration: { name: { text: 'Plain' } } } as never);
    expect(await getImportOrExtract('Plain', 'Plain', '/src', './utils')).toEqual(symbol);

    vi.mocked(resolveExportedClass).mockReturnValueOnce({ sourceFile: { fileName: '/src/anonymous.ts' }, declaration: {} } as never);
    expect(await getImportOrExtract('default', 'Anonymous', '/src', './utils')).toEqual(symbol);
    expect(readFile).toHaveBeenCalledTimes(4);
  });
});

describe('resolveTemplateModules()', () => {
  const importNodes = (template: string) => parseTemplate(template).filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  const imports: Record<string, ComponentOrDirectiveMetadata | ImportedSymbol> = {
    Card: createMetadata('x-card', 'Card', '/src/ui/card.xd.component.ts'),
    Tip: createDirectiveMetadata('tip', 'Tip', '/src/ui/tip.directive.ts'),
    format: { type: 'symbol', modulePath: '/src/format.ts', reactive: false },
    missing: { type: 'symbol', modulePath: '/src/missing.ts', reactive: false },
    Row: { type: 'symbol', modulePath: '/src/row.d.ts', reactive: false },
    price: { type: 'symbol', modulePath: '/node_modules/acme/index.d.ts', importPath: 'acme', reactive: false }
  };
  const cache = { getImport: vi.fn(async (imported: string) => imports[imported]) };
  const host = { fileExists: (path: string) => path !== '/src/missing.ts' };

  it('imports, once each, the files declaring the components and the directives, and the modules of the symbols of the project', async () => {
    const template = '@import { Card, Tip, format, missing, Row } from \'./ui\'\n@import { Card as Other } from \'./ui\'\n@import { price } from \'acme\'';
    const modules = ['/src/ui/card.xd.component.ts', '/src/ui/tip.directive.ts', '/src/format.ts'];

    expect(await resolveTemplateModules(importNodes(template), '/src', cache, host)).toEqual({ imported: modules, watched: modules });
    expect(cache.getImport).toHaveBeenCalledWith('Card', 'Other', '/src', './ui');
  });

  it('watches the modules of an @import lazy without importing them', async () => {
    const template = '@import lazy { Card } from \'./ui\'\n@import { format } from \'./format\'';

    expect(await resolveTemplateModules(importNodes(template), '/src', cache, host)).toEqual({ imported: ['/src/format.ts'], watched: ['/src/ui/card.xd.component.ts', '/src/format.ts'] });
  });
});

describe('packages and aliases of the project', () => {
  let root: string;
  let compilerOptions: CompilerOptions;

  beforeAll(async () => {
    // TypeScript resolves the packages on the real file system: node:fs is mocked for the relative paths only
    const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
    // The real path, which TypeScript resolves the files of the packages to: the temporary directory can be reached through a short name or a symlink
    root = toPosixPath(fs.realpathSync.native(fs.mkdtempSync(join(tmpdir(), 'xd-plugin-utils-'))));
    const write = (path: string, content: string) => {
      fs.mkdirSync(dirname(join(root, path)), { recursive: true });
      fs.writeFileSync(join(root, path), content);
    };
    write('node_modules/@acme/format/package.json', JSON.stringify({ name: '@acme/format', exports: { '.': { types: './index.d.ts', default: './index.js' } } }));
    write('node_modules/@acme/format/index.d.ts', 'export declare function formatPrice(value: number): string;');
    write('src/lib/format.ts', 'export const LIMIT = 5;');
    compilerOptions = { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, paths: { '@lib/*': ['./src/lib/*'] }, pathsBasePath: root };
  });

  afterAll(async () => {
    (await vi.importActual<typeof import('node:fs')>('node:fs')).rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(readFile).mockResolvedValue('export const LIMIT = 5;');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(undefined);
    vi.mocked(extractDirectivesMetadataFromSourceFile).mockResolvedValue(undefined);
    vi.mocked(isReactiveExport).mockReturnValue(false);
  });

  it('imports a symbol of a package by the path written in the template, without reading its declarations for metadata', async () => {
    expect(await getImportOrExtract('formatPrice', 'formatPrice', `${root}/src`, '@acme/format', compilerOptions)).toEqual({
      type: 'symbol',
      modulePath: `${root}/node_modules/@acme/format/index.d.ts`,
      importPath: '@acme/format',
      reactive: false
    });
    expect(readFile).not.toHaveBeenCalled();
  });

  it('imports a symbol reached through an alias by the path of its file, and reads it for metadata', async () => {
    expect(await getImportOrExtract('LIMIT', 'LIMIT', `${root}/src`, '@lib/format', compilerOptions)).toEqual({
      type: 'symbol',
      modulePath: `${root}/src/lib/format.ts`,
      reactive: false
    });
    expect(readFile).toHaveBeenCalledWith(`${root}/src/lib/format.ts`, 'utf-8');
  });

  it('resolves the components imported through an alias, and watches the modules of the aliases but not the packages', async () => {
    const metadata = createMetadata('lib-el', 'Lib', `${root}/src/lib/format.ts`);
    vi.mocked(getMetadata).mockImplementation((name, path) => (name === 'Lib' && path === `${root}/src/lib/format.ts` ? metadata : undefined));
    expect(await getMetadataOrExtract('Lib', [`${root}/src`, '@lib/format'], compilerOptions)).toBe(metadata);

    const template = '@import { formatPrice } from \'@acme/format\';\n@import { LIMIT } from \'@lib/format\';';
    expect(extractImportedComponentPaths(template, `${root}/src`, compilerOptions)).toEqual([`${root}/src/lib/format.ts`]);
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

describe('compiled libraries', () => {
  const declarationFile = resolvePosixPath('/src', './card.d.ts');
  const card = Object.assign(createMetadata('ui-card', 'Card', '/app/node_modules/@acme/ui/card.d.ts'), {
    type: 'component',
    importPath: '@acme/ui/card',
    library: { name: '@acme/ui', root: '/app/node_modules/@acme/ui', ssr: false }
  }) as LibraryComponentMetadata;

  beforeEach(() => {
    vi.mocked(getMetadata).mockReturnValue(undefined);
    vi.mocked(getLibrarySelectorOwner).mockReset();
    vi.mocked(readLibraryMetadata).mockReset();
    vi.mocked(existsSync).mockImplementation(path => path === declarationFile);
  });

  it('reads a component of a compiled library from its manifest, registering it once, by its selector', async () => {
    vi.mocked(readLibraryMetadata).mockReturnValue(card);

    expect(await getImportOrExtract('Card', 'Card', '/src', './card.d.ts')).toBe(card);
    expect(readLibraryMetadata).toHaveBeenCalledWith(declarationFile, 'Card');
    expect(registerSelectors).toHaveBeenCalledWith(card, card.modulePath);
    expect(registerMetadata).toHaveBeenCalledWith('Card', card);

    vi.clearAllMocks();
    vi.mocked(getMetadata).mockReturnValue(card);
    expect(await getImportOrExtract('Card', 'Card', '/src', './card.d.ts')).toBe(card);
    expect(registerMetadata).not.toHaveBeenCalled();
    expect(await getImportOrExtract('*', 'ui', '/src', './card.d.ts')).toEqual({ type: 'symbol', modulePath: declarationFile, reactive: true });
    expect(readLibraryMetadata).toHaveBeenCalledOnce();
  });

  it('rejects a component of a compiled library whose selector a component of the project declares', async () => {
    vi.mocked(readLibraryMetadata).mockReturnValue(card);
    vi.mocked(getSelectorOwner).mockReturnValue({ ownerFile: '/src/mine.ts', className: 'Mine' });
    vi.mocked(readFile).mockResolvedValue('export class Mine {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['Mine', createMetadata('ui-card', 'Mine', '/src/mine.ts') as unknown as ComponentMetadata]]));

    await expect(getImportOrExtract('Card', 'Card', '/src', './card.d.ts')).rejects.toBe('Selector "ui-card" of component "Card" - /app/node_modules/@acme/ui/card.d.ts is already used by component "Mine" - /src/mine.ts. Custom element names must be unique.');
    expect(registerMetadata).not.toHaveBeenCalled();
  });

  it('rejects a selector a compiled library defines, unless the component or the directive is of that library', async () => {
    vi.mocked(getLibrarySelectorOwner).mockReturnValue('@acme/ui');

    expect(await claimSelectors(createMetadata('ui-card'))).toBe('Selector "ui-card" of component "Foo" - /src/foo.ts is already used by a component of @acme/ui. Custom element names must be unique.');
    expect(await claimSelectors(createDirectiveMetadata('uiTip'))).toBe('Selector "uiTip" of directive "FooDirective" - /src/foo.ts is already used by a directive of @acme/ui. Directive selectors must be unique.');
    expect(await claimSelectors(card)).toBeUndefined();
    expect(registerSelectors).toHaveBeenCalledExactlyOnceWith(card, card.modulePath);
  });

  it('keeps a selector a component of a compiled library owns, without reading its declarations', async () => {
    vi.mocked(getSelectorOwner).mockReturnValue({ ownerFile: card.modulePath, className: 'Card' });

    expect(await claimSelectors(createMetadata('ui-card'))).toBe('Selector "ui-card" of component "Foo" - /src/foo.ts is already used by component "Card" - /app/node_modules/@acme/ui/card.d.ts. Custom element names must be unique.');
    expect(readFile).not.toHaveBeenCalled();
  });

  it('imports a component of a compiled library by the path of its package, without watching it', async () => {
    const nodes = parseTemplate('@import { Card } from \'@acme/ui\'').filter((node): node is ImportNode => node.type === ASTNodeType.Import);

    expect(await resolveTemplateModules(nodes, '/src', { getImport: async () => card }, { fileExists: () => true })).toEqual({ imported: ['@acme/ui/card'], watched: [] });
  });
});

describe('describeEventCheckDiagnostic()', () => {
  const templateSource = '<div (bubbling)="go()"></div>';
  const eventChecks = [{ span: { start: 5, end: 22 }, nameSpan: { start: 6, end: 14 }, message: '\'bubbling\' is not an event of <div>' }];
  const diagnostic = (code: number) => ({
    code,
    messageText: 'Type \'"bubbling"\' does not satisfy the expected type \'keyof HTMLElementEventMap\'.',
    file: { getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 3, character: 0 }) },
    start: 10
  }) as unknown as Diagnostic;

  it('describes the rejected name of an event the element does not declare as a warning on the name', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 5, end: 22 });

    expect(describeEventCheckDiagnostic(templateSource, diagnostic(1360), 1, { mappingTable: new Map(), eventChecks })).toBe('[Ln 1, Col 7] - \'bubbling\' is not an event of <div>\n ---> bubbling');
  });

  it('describes nothing for another diagnostic, one outside of the template, or a template checking no event', () => {
    vi.mocked(resolveTemplateSpan).mockReturnValue({ start: 5, end: 22 });

    expect(describeEventCheckDiagnostic(templateSource, diagnostic(2339), 1, { mappingTable: new Map(), eventChecks })).toBeUndefined();
    expect(describeEventCheckDiagnostic(templateSource, diagnostic(1360), 5, { mappingTable: new Map(), eventChecks })).toBeUndefined();
    expect(describeEventCheckDiagnostic(templateSource, diagnostic(1360), 1, { mappingTable: new Map() })).toBeUndefined();
  });
});
