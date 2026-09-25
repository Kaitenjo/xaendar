import type { ComponentMetadata, TypeCheckResult } from '@xaendar/compiler';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/plugin.types';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn()
}));

vi.mock('@xaendar/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/common')>();
  return {
    ...actual,
    isValidCustomElementName: vi.fn()
  };
});

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    compile: vi.fn(),
    extractComponentsMetadataFromSourceFile: vi.fn(),
    extractSignalMembers: vi.fn()
  };
});

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    createShim: vi.fn(),
    getLanguageService: vi.fn(),
    registerRealFile: vi.fn()
  };
});

vi.mock('../../registry/import-registry/import-registry', () => ({
  clearComponentToImports: vi.fn(),
  registerImport: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  clearMetadataForFile: vi.fn(),
  registerMetadata: vi.fn()
}));

vi.mock('../../registry/style-registry/style-registry', () => ({
  clearStyleDependenciesForComponent: vi.fn(),
  registerStyleDependency: vi.fn()
}));

vi.mock('../../registry/template-registry/template-registry', () => ({
  registerTemplatePath: vi.fn(),
  removeComponentPath: vi.fn()
}));

vi.mock('../plugin-utils/plugin.utils', () => ({
  describeDiagnostic: vi.fn(),
  extractImportedComponentPaths: vi.fn(),
  getMetadataOrExtract: vi.fn(),
  injectFunctions: vi.fn()
}));

vi.mock('../style/compile-style', () => ({
  compileStyle: vi.fn()
}));

import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile } from '@xaendar/compiler';
import { createShim, getLanguageService, registerRealFile } from '@xaendar/language-core';
import { TransformPluginContext } from 'rolldown';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import { describeDiagnostic, extractImportedComponentPaths, injectFunctions } from '../plugin-utils/plugin.utils';
import { compileStyle } from '../style/compile-style';
import { createTransformHook } from './transform';

const COMPONENT_PATH = '/src/foo/foo.xd.component.ts';

function createMetadata(overrides: Partial<ComponentMetadata> = {}): ComponentMetadata {
  return {
    type: 'component',
    className: 'FooComponent',
    selectors: ['foo-el'],
    templateUrl: './foo.xd.component.html',
    properties: new Map(),
    events: new Map(),
    typescriptNodes: { klass: {} } as ComponentMetadata['typescriptNodes'],
    ...overrides
  };
}

function createState(overrides: Partial<{ fileExists: (path: string) => boolean; readFile: (path: string) => string | undefined }> = {}): XaendarPluginState {
  const fileExists = overrides.fileExists ?? (() => true);
  const readFileFromHost = overrides.readFile ?? (() => 'template source');

  return {
    host: {
      fileExists: vi.fn(fileExists),
      readFile: vi.fn(readFileFromHost)
    } as unknown as NodeCompilerHost,
    compilerOptions: {} as XaendarPluginState['compilerOptions'],
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

function createPluginContext(): TransformPluginContext {
  return {
    warn: vi.fn(),
    addWatchFile: vi.fn()
  } as unknown as TransformPluginContext;
}

function mockSuccessfulCompile(typecheckBody: Partial<TypeCheckResult> = {}) {
  vi.mocked(compile).mockResolvedValue({
    javascript: '/* compiled methods */',
    typescript: { mappingTable: new Map(), ...typecheckBody } as TypeCheckResult
  });
}

function mockNoDiagnostics() {
  vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 0 } as ReturnType<typeof createShim>);
  vi.mocked(getLanguageService).mockReturnValue({
    getSemanticDiagnostics: vi.fn().mockReturnValue([])
  } as unknown as ReturnType<typeof getLanguageService>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidCustomElementName).mockReturnValue(true);
  vi.mocked(extractImportedComponentPaths).mockReturnValue([]);
  vi.mocked(injectFunctions).mockImplementation((code) => code);
  mockSuccessfulCompile();
  mockNoDiagnostics();
});

describe('createTransformHook()', () => {
  it('returns the code unchanged when the file is not a component file', async () => {
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'const x = 1;', '/src/foo/util.ts', undefined);

    expect(result).toBe('const x = 1;');
    expect(readFile).not.toHaveBeenCalled();
  });

  it('returns the code unchanged when no component metadata could be extracted (undefined map)', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(undefined);
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBe('original code');
  });

  it('returns the code unchanged when the extracted metadata map is empty', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map());
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBe('original code');
  });

  it('logs an error and returns null when a selector is not a valid custom element name', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata({ selectors: ['valid-el', 'Invalid'] });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(isValidCustomElementName).mockImplementation((selector: string) => selector === 'valid-el');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', `Invalid custom element name "Invalid" in component ${COMPONENT_PATH}`);
  });

  it('warns and returns null when the template file cannot be found', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState({ fileExists: () => false });
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    const result = await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(ctx.warn).toHaveBeenCalledWith(expect.stringContaining('Could not find template at'));
  });

  it('clears stale registry entries before processing the component', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(clearMetadataForFile).toHaveBeenCalledWith(COMPONENT_PATH);
    expect(clearComponentToImports).toHaveBeenCalledWith(COMPONENT_PATH);
    expect(clearStyleDependenciesForComponent).toHaveBeenCalledWith(COMPONENT_PATH);
    expect(removeComponentPath).toHaveBeenCalledWith(COMPONENT_PATH);
  });

  it('watches the template and registers imported components that exist on disk', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(extractImportedComponentPaths).mockReturnValue(['/src/foo/existing.xd.component.ts', '/src/foo/missing.xd.component.ts']);
    const state = createState({
      fileExists: (p) => !p.includes('missing')
    });
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    const templatePath = resolve(dirname(COMPONENT_PATH), './foo.xd.component.html');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(templatePath);
    expect(registerTemplatePath).toHaveBeenCalledWith(templatePath, COMPONENT_PATH);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/existing.xd.component.ts');
    expect(registerImport).toHaveBeenCalledWith('/src/foo/existing.xd.component.ts', COMPONENT_PATH);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith('/src/foo/missing.xd.component.ts');
    expect(registerImport).not.toHaveBeenCalledWith('/src/foo/missing.xd.component.ts', COMPONENT_PATH);
  });

  it('skips style compilation when the component has no styleUrl', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(compileStyle).not.toHaveBeenCalled();
    expect(injectFunctions).toHaveBeenCalledWith('original code', true, '/* compiled methods */', 'FooComponent', undefined, undefined);
  });

  it('compiles and watches every style dependency when a styleUrl is set', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata({ styleUrl: './foo.css' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(compileStyle).mockReturnValue({
      cssText: '.a { color: red; }',
      dependencyPaths: ['/src/foo/foo.css', '/src/foo/partial.css']
    });
    const state = createState();
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    const stylePath = resolve(dirname(COMPONENT_PATH), './foo.css');
    expect(compileStyle).toHaveBeenCalledWith(stylePath, state.host);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/foo.css');
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/partial.css');
    expect(registerStyleDependency).toHaveBeenCalledWith('/src/foo/foo.css', COMPONENT_PATH);
    expect(registerStyleDependency).toHaveBeenCalledWith('/src/foo/partial.css', COMPONENT_PATH);
    expect(injectFunctions).toHaveBeenCalledWith('original code', true, '/* compiled methods */', 'FooComponent', '__FooComponent_sheet', '.a { color: red; }');
  });

  it('leaves varName undefined when style compilation yields no CSS text', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata({ styleUrl: './foo.css' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(compileStyle).mockReturnValue({ cssText: undefined, dependencyPaths: [] });
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(injectFunctions).toHaveBeenCalledWith('original code', true, '/* compiled methods */', 'FooComponent', undefined, undefined);
  });

  it('logs an error and returns null when template compilation throws', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(compile).mockRejectedValue(new Error('boom'));
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining('Failed to compile template'));
  });

  it('logs an error and returns null when injecting the compiled functions throws', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(injectFunctions).mockImplementation(() => { throw new Error('inject failed'); });
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining('Failed to inject functions into component'));
  });

  it('registers the real file and requests semantic diagnostics for the generated shim', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(registerRealFile).toHaveBeenCalledWith(COMPONENT_PATH);
    expect(createShim).toHaveBeenCalledWith(new Map([[COMPONENT_PATH, ['FooComponent']]]), expect.any(Object));
    expect(getLanguageService).toHaveBeenCalledWith(state.compilerOptions);
  });

  it('logs every semantic diagnostic and returns null when the shim reports errors', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 2 } as ReturnType<typeof createShim>);
    vi.mocked(getLanguageService).mockReturnValue({
      getSemanticDiagnostics: vi.fn().mockReturnValue(['diag-1', 'diag-2'])
    } as unknown as ReturnType<typeof getLanguageService>);
    vi.mocked(describeDiagnostic).mockReturnValueOnce('first problem').mockReturnValueOnce('second problem');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', expect.stringContaining('first problem'));
    expect(state.logError).toHaveBeenCalledWith('', expect.stringContaining('second problem'));
  });

  it('processes every declared component and only prepends required imports for the first one', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {} class BarComponent {}');
    const fooMetadata = createMetadata({ className: 'FooComponent' });
    const barMetadata = createMetadata({ className: 'BarComponent', selectors: ['bar-el'], templateUrl: './bar.xd.component.html' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([
      ['FooComponent', fooMetadata],
      ['BarComponent', barMetadata]
    ]));
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(injectFunctions).toHaveBeenNthCalledWith(1, 'original code', true, '/* compiled methods */', 'FooComponent', undefined, undefined);
    expect(injectFunctions).toHaveBeenNthCalledWith(2, 'original code', false, '/* compiled methods */', 'BarComponent', undefined, undefined);
    expect(result).toEqual({ code: 'original code' });
  });

  it('reorders a decorator placed before an export before the class declaration in the final output', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(injectFunctions).mockReturnValue('export @Component()\nclass FooComponent {}');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toEqual({ code: '@Component()\nexport class FooComponent {}' });
  });
});
