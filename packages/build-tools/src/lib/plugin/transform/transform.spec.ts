import type { ComponentMetadata, TypeCheckResult } from '@xaendar/compiler';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
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

vi.mock('../../registry/base-class-registry/base-class-registry', () => ({
  clearBaseClassDependenciesForComponent: vi.fn(),
  registerBaseClassDependency: vi.fn()
}));

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
  claimSelectors: vi.fn(),
  createStyleModuleSpecifier: vi.fn(),
  createTemplateModuleSpecifier: vi.fn(),
  describeDiagnostic: vi.fn(),
  extractImportedComponentPaths: vi.fn(),
  getMetadataOrExtract: vi.fn(),
  injectTemplate: vi.fn()
}));

import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractSignalMembers } from '@xaendar/compiler';
import { createShim, getLanguageService, registerRealFile } from '@xaendar/language-core';
import { TransformPluginContext } from 'rolldown';
import { clearBaseClassDependenciesForComponent, registerBaseClassDependency } from '../../registry/base-class-registry/base-class-registry';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, injectTemplate } from '../plugin-utils/plugin.utils';
import { createTransformHook } from './transform';

/**
 * Path of the component file the tests transform.
 */
const COMPONENT_PATH = '/src/foo/foo.xd.component.ts';

/**
 * Builds the metadata of the `FooComponent` fixture, with optional overrides.
 *
 * @param overrides - Fields to override on the default metadata.
 * @returns The component metadata.
 */
function createMetadata(overrides: Partial<ComponentMetadata> = {}): ComponentMetadata {
  return {
    type: 'component',
    className: 'FooComponent',
    selector: 'foo-el',
    templateUrl: './foo.xd.component.html',
    properties: new Map(),
    events: new Map(),
    typescriptNodes: { klass: {} } as ComponentMetadata['typescriptNodes'],
    ...overrides
  };
}

/**
 * Builds a fresh `XaendarPluginState` with a mocked compiler host, for a test to assert on.
 *
 * @param overrides - `fileExists`/`readFile` implementations for the mocked host.
 * @returns The mocked plugin state.
 */
function createState(overrides: Partial<{ fileExists: (path: string) => boolean; readFile: (path: string) => string | undefined }> = {}): XaendarPluginState {
  const fileExists = overrides.fileExists ?? (() => true);
  const readFileFromHost = overrides.readFile ?? (() => 'template source');

  return {
    host: {
      fileExists: vi.fn(fileExists),
      readFile: vi.fn(readFileFromHost)
    } as unknown as NodeCompilerHost,
    compilerOptions: {} as XaendarPluginState['compilerOptions'],
    projectFileNames: ['/project/src/globals.d.ts'],
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

/**
 * Builds a mocked `transform` hook plugin context (`warn`/`addWatchFile`).
 *
 * @returns The mocked plugin context.
 */
function createPluginContext(): TransformPluginContext {
  return {
    warn: vi.fn(),
    addWatchFile: vi.fn()
  } as unknown as TransformPluginContext;
}

/**
 * Mocks a successful `compile()` call resolving to a `TypeCheckResult`.
 *
 * @param typecheckBody - Fields to override on the default resolved result.
 */
function mockSuccessfulCompile(typecheckBody: Partial<TypeCheckResult> = {}) {
  vi.mocked(compile).mockResolvedValue({ mappingTable: new Map(), ...typecheckBody } as TypeCheckResult);
}

/**
 * Mocks the shim/language service pair so that `getSemanticDiagnostics` reports no diagnostics.
 */
function mockNoDiagnostics() {
  vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 0 } as ReturnType<typeof createShim>);
  vi.mocked(getLanguageService).mockReturnValue({
    getSemanticDiagnostics: vi.fn().mockReturnValue([])
  } as unknown as ReturnType<typeof getLanguageService>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidCustomElementName).mockReturnValue(true);
  vi.mocked(claimSelectors).mockResolvedValue(undefined);
  vi.mocked(extractImportedComponentPaths).mockReturnValue([]);
  vi.mocked(injectTemplate).mockImplementation(() => undefined);
  vi.mocked(extractSignalMembers).mockReturnValue({ members: ['count'], dependencies: [] });
  vi.mocked(createTemplateModuleSpecifier).mockReturnValue('template-module');
  vi.mocked(createStyleModuleSpecifier).mockReturnValue('style-module');
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

  it('logs an error and returns null when the selector is not a valid custom element name', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata({ selector: 'Invalid' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(isValidCustomElementName).mockReturnValue(false);
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', `Invalid custom element name "Invalid" in component ${COMPONENT_PATH}`);
    expect(claimSelectors).not.toHaveBeenCalled();
    expect(registerMetadata).not.toHaveBeenCalled();
  });

  it('logs an error and returns null when a selector is already used by another component, registering no metadata', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(claimSelectors).mockResolvedValue('selector conflict');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(claimSelectors).toHaveBeenCalledWith(metadata);
    expect(state.logError).toHaveBeenCalledWith('', 'selector conflict');
    expect(registerMetadata).not.toHaveBeenCalled();
    expect(compile).not.toHaveBeenCalled();
  });

  it('claims the selector and registers the metadata of each component', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const hook = createTransformHook(createState());

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(claimSelectors).toHaveBeenCalledWith(metadata);
    expect(registerMetadata).toHaveBeenCalledWith('FooComponent', metadata);
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
    expect(clearBaseClassDependenciesForComponent).toHaveBeenCalledWith(COMPONENT_PATH);
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

    const templatePath = resolvePosixPath(dirname(COMPONENT_PATH), './foo.xd.component.html');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(templatePath);
    expect(registerTemplatePath).toHaveBeenCalledWith(templatePath, COMPONENT_PATH);
    // Registry keys must be posix, to match the Vite ids received by watchChange
    expect(registerTemplatePath).toHaveBeenCalledWith(expect.not.stringContaining('\\'), COMPONENT_PATH);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/existing.xd.component.ts');
    expect(registerImport).toHaveBeenCalledWith('/src/foo/existing.xd.component.ts', COMPONENT_PATH);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith('/src/foo/missing.xd.component.ts');
    expect(registerImport).not.toHaveBeenCalledWith('/src/foo/missing.xd.component.ts', COMPONENT_PATH);
  });

  it('imports no style module when the component has no styleUrl', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(createStyleModuleSpecifier).not.toHaveBeenCalled();
    expect(registerStyleDependency).not.toHaveBeenCalled();
    expect(injectTemplate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', undefined);
  });

  it('only type-checks the template, leaving the render function to the template module', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    const templatePath = resolvePosixPath(dirname(COMPONENT_PATH), './foo.xd.component.html');
    expect(compile).toHaveBeenCalledWith('template source', { baseDir: dirname(templatePath), cache: expect.any(Object) });
    // The baseDir resolves the @import paths used as metadata owner file keys, which are posix
    expect(compile).toHaveBeenCalledWith('template source', { baseDir: expect.not.stringContaining('\\'), cache: expect.any(Object) });
    expect(createTemplateModuleSpecifier).toHaveBeenCalledWith(templatePath, ['count']);
  });

  it('extracts the signal members with the project compiler options, watching and registering the base class files they depend on', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(extractSignalMembers).mockReturnValue({ members: ['count'], dependencies: ['/src/base.ts', '/node_modules/lib/index.d.ts'] });
    const state = createState();
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    expect(extractSignalMembers).toHaveBeenCalledWith(expect.anything(), metadata.typescriptNodes.klass, state.compilerOptions);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/base.ts');
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/node_modules/lib/index.d.ts');
    expect(registerBaseClassDependency).toHaveBeenCalledWith('/src/base.ts', COMPONENT_PATH);
    expect(registerBaseClassDependency).toHaveBeenCalledWith('/node_modules/lib/index.d.ts', COMPONENT_PATH);
  });

  it('imports the style module of the styleUrl, leaving its compilation to the style module', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata({ styleUrl: './foo.css' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    const stylePath = resolvePosixPath(dirname(COMPONENT_PATH), './foo.css');
    expect(createStyleModuleSpecifier).toHaveBeenCalledWith(stylePath);
    expect(registerStyleDependency).toHaveBeenCalledWith(stylePath, COMPONENT_PATH);
    // Registry keys must be posix, to match the Vite ids received by watchChange
    expect(registerStyleDependency).toHaveBeenCalledWith(expect.not.stringContaining('\\'), COMPONENT_PATH);
    expect(state.host.readFile).not.toHaveBeenCalledWith(stylePath);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith(stylePath);
    expect(injectTemplate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', 'style-module');
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

  it('logs an error and returns null when injecting the template throws', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(injectTemplate).mockImplementation(() => { throw new Error('inject failed'); });
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining('Failed to inject template into component'));
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
    expect(getLanguageService).toHaveBeenCalledWith(state.compilerOptions, state.projectFileNames);
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

  it('processes every declared component sharing the same module imports of the file', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {} class BarComponent {}');
    const fooMetadata = createMetadata({ className: 'FooComponent' });
    const barMetadata = createMetadata({ className: 'BarComponent', selector: 'bar-el', templateUrl: './bar.xd.component.html' });
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([
      ['FooComponent', fooMetadata],
      ['BarComponent', barMetadata]
    ]));
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(injectTemplate).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', undefined);
    expect(injectTemplate).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), expect.any(Map), 'BarComponent', 'template-module', undefined);
    expect(vi.mocked(injectTemplate).mock.calls[0][2]).toBe(vi.mocked(injectTemplate).mock.calls[1][2]);
    expect(result).toEqual({ code: 'original code', map: expect.anything() });
  });

  it('reorders a decorator placed before an export before the class declaration in the final output', async () => {
    const sourceCode = 'export @Component()\nclass FooComponent {}';
    vi.mocked(readFile).mockResolvedValue(sourceCode);
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), sourceCode, COMPONENT_PATH, undefined);

    expect(result).toEqual({ code: '@Component()\nexport class FooComponent {}', map: expect.anything() });
  });
});
