import type { CompileOptions, ComponentMetadata, TypeCheckResult } from '@xaendar/compiler';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

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
    extractComponentMembers: vi.fn(),
    findWebComponentErrors: vi.fn()
  };
});

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    createShim: vi.fn(),
    getImportConflictDiagnostics: vi.fn(),
    getLanguageService: vi.fn(),
    registerRealFile: vi.fn()
  };
});

vi.mock('../../registry/dependency-registry/dependency-registry', () => ({
  clearDependenciesForComponent: vi.fn(),
  registerDependency: vi.fn()
}));

vi.mock('../../utils/project-dependencies/project-dependencies.utils', () => ({
  collectProjectDependencies: vi.fn()
}));

vi.mock('../../utils/type-check/type-check.utils', () => ({
  collectFileDiagnostics: vi.fn(),
  formatTypeDiagnostics: vi.fn()
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
  generateServerStyleModule: vi.fn(),
  generateServerTemplateModule: vi.fn(),
  generateStyleModule: vi.fn(),
  generateTemplateModule: vi.fn(),
  getImportOrExtract: vi.fn(),
  getMetadataOrExtract: vi.fn(),
  injectTemplate: vi.fn()
}));

import { isValidCustomElementName } from '@xaendar/common';
import { compile, extractComponentsMetadataFromSourceFile, extractComponentMembers, findWebComponentErrors } from '@xaendar/compiler';
import { createShim, getImportConflictDiagnostics, getLanguageService, registerRealFile } from '@xaendar/language-core';
import { TransformPluginContext } from 'rolldown';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { clearDependenciesForComponent, registerDependency } from '../../registry/dependency-registry/dependency-registry';
import { clearComponentToImports, registerImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile, registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, registerStyleDependency } from '../../registry/style-registry/style-registry';
import { registerTemplatePath, removeComponentPath } from '../../registry/template-registry/template-registry';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { collectProjectDependencies } from '../../utils/project-dependencies/project-dependencies.utils';
import { collectFileDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';
import { claimSelectors, createStyleModuleSpecifier, createTemplateModuleSpecifier, describeDiagnostic, extractImportedComponentPaths, getImportOrExtract, getMetadataOrExtract, injectTemplate } from '../plugin-utils/plugin.utils';
import { createTransformHook } from './transform';

/**
 * `compile` as the transform hook calls it: the overload type-checking the template only.
 */
const compileTypeCheck: (input: string, options: Pick<CompileOptions, 'baseDir' | 'shadowingMembers' | 'reactiveMembers' | 'customElements' | 'cache'>) => Promise<TypeCheckResult> = compile;

/**
 * Path of the component file the tests transform.
 */
const COMPONENT_PATH = '/src/foo/foo.xd.component.ts';

/**
 * Program of the mocked language service.
 */
const PROGRAM = {};

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
    customElements: [],
    minifyStyles: false,
    isBuild: false,
    setLogger: vi.fn(),
    logError: vi.fn(),
    strategies: { client: CLIENT_STRATEGY, server: SERVER_STRATEGY }
  };
}

/**
 * Builds a mocked `transform` hook plugin context (`warn`/`addWatchFile`/`error`, which throws as Vite's does).
 *
 * @param consumer - The consumer of the environment, the browser by default.
 * @returns The mocked plugin context.
 */
function createPluginContext(consumer: 'client' | 'server' = 'client'): TransformPluginContext {
  return {
    warn: vi.fn(),
    addWatchFile: vi.fn(),
    error: vi.fn((message: string) => { throw new Error(message); }),
    environment: { config: { consumer } }
  } as unknown as TransformPluginContext;
}

/**
 * Mocks a successful `compile()` call resolving to a `TypeCheckResult`.
 *
 * @param typecheckBody - Fields to override on the default resolved result.
 */
function mockSuccessfulCompile(typecheckBody: Partial<TypeCheckResult> = {}) {
  vi.mocked(compileTypeCheck).mockResolvedValue({ mappingTable: new Map(), ...typecheckBody } as TypeCheckResult);
}

/**
 * Mocks the shim/language service pair so that `getSemanticDiagnostics` reports no diagnostics.
 */
function mockNoDiagnostics() {
  vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 0 } as ReturnType<typeof createShim>);
  vi.mocked(getLanguageService).mockReturnValue({
    getSemanticDiagnostics: vi.fn().mockReturnValue([]),
    getProgram: vi.fn().mockReturnValue(PROGRAM)
  } as unknown as ReturnType<typeof getLanguageService>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isValidCustomElementName).mockReturnValue(true);
  vi.mocked(findWebComponentErrors).mockReturnValue(undefined);
  vi.mocked(claimSelectors).mockResolvedValue(undefined);
  vi.mocked(extractImportedComponentPaths).mockReturnValue([]);
  vi.mocked(injectTemplate).mockImplementation(() => undefined);
  vi.mocked(extractComponentMembers).mockReturnValue({ reactiveMembers: ['count'], shadowingMembers: ['name'], dependencies: [] });
  vi.mocked(createTemplateModuleSpecifier).mockReturnValue('template-module');
  vi.mocked(createStyleModuleSpecifier).mockReturnValue('style-module');
  vi.mocked(collectProjectDependencies).mockReturnValue([]);
  vi.mocked(collectFileDiagnostics).mockReturnValue([]);
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

  it('reads the source of a TypeScript file mentioning WebComponent outside the component convention, returning it unchanged without components', async () => {
    vi.mocked(readFile).mockResolvedValue('import { WebComponent } from \'@xaendar/core\';');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'import { WebComponent } from "@xaendar/core";', '/src/foo/util.ts', undefined);

    expect(result).toBe('import { WebComponent } from "@xaendar/core";');
    expect(readFile).toHaveBeenCalledWith('/src/foo/util.ts', 'utf8');
    expect(findWebComponentErrors).toHaveBeenCalledWith(expect.objectContaining({ fileName: '/src/foo/util.ts' }), false);
    expect(extractComponentsMetadataFromSourceFile).not.toHaveBeenCalled();
    expect(state.logError).not.toHaveBeenCalled();
  });

  it('logs each component declared outside the component convention and returns null', async () => {
    vi.mocked(readFile).mockResolvedValue('@WebComponent({}) class A {}');
    vi.mocked(findWebComponentErrors).mockReturnValue(['A must be declared in a file ending with .xd.component.ts', 'B must be declared in a file ending with .xd.component.ts']);
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'WebComponent(A)', '/src/foo/util.ts', undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', 'A must be declared in a file ending with .xd.component.ts - /src/foo/util.ts');
    expect(state.logError).toHaveBeenCalledWith('', 'B must be declared in a file ending with .xd.component.ts - /src/foo/util.ts');
  });

  it('logs the options of a component that are not string literals and returns null, extracting no metadata', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(findWebComponentErrors).mockReturnValue(['The templateUrl option of FooComponent must be a string literal']);
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(findWebComponentErrors).toHaveBeenCalledWith(expect.objectContaining({ fileName: COMPONENT_PATH }), true);
    expect(state.logError).toHaveBeenCalledWith('', `The templateUrl option of FooComponent must be a string literal - ${COMPONENT_PATH}`);
    expect(extractComponentsMetadataFromSourceFile).not.toHaveBeenCalled();
  });

  it('does not serve a TypeScript file with type errors in the dev server, raising them', async () => {
    vi.mocked(collectFileDiagnostics).mockReturnValue(['diag'] as unknown as ReturnType<typeof collectFileDiagnostics>);
    vi.mocked(formatTypeDiagnostics).mockReturnValue('util.ts(1,7): error TS2322');
    const state = createState();
    const hook = createTransformHook(state);

    await expect(hook.call(createPluginContext(), 'const x = 1;', '/src/foo/util.ts', undefined)).rejects.toThrow('[TypeChecker] Type check failed\nutil.ts(1,7): error TS2322');
    expect(getLanguageService).toHaveBeenCalledWith(state.compilerOptions, state.projectFileNames);
    expect(collectFileDiagnostics).toHaveBeenCalledWith(expect.anything(), '/src/foo/util.ts');
    expect(formatTypeDiagnostics).toHaveBeenCalledWith(['diag']);
  });

  it('serves a TypeScript file without type errors', async () => {
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'const x = 1;', '/src/foo/util.ts', undefined);

    expect(collectFileDiagnostics).toHaveBeenCalledWith(expect.anything(), '/src/foo/util.ts');
    expect(state.logError).not.toHaveBeenCalled();
  });

  it('does not type-check the files that are not TypeScript, nor any file in a build', async () => {
    const devHook = createTransformHook(createState());
    const buildState = createState();
    buildState.isBuild = true;
    const buildHook = createTransformHook(buildState);

    await devHook.call(createPluginContext(), 'export default "";', '/src/foo/foo.ts?raw', undefined);
    await devHook.call(createPluginContext(), '.a {}', '/src/foo/foo.css', undefined);
    await buildHook.call(createPluginContext(), 'const x = 1;', '/src/foo/util.ts', undefined);

    expect(collectFileDiagnostics).not.toHaveBeenCalled();
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

  it('logs an error and returns null when the template file cannot be found', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState({ fileExists: () => false });
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    const result = await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', `Could not find template at ${resolvePosixPath(dirname(COMPONENT_PATH), './foo.xd.component.html')}`);
    expect(ctx.warn).not.toHaveBeenCalled();
  });

  it('registers a missing template without watching it, so that creating it compiles the component again', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
    const hook = createTransformHook(createState({ fileExists: () => false }));
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    const templatePath = resolvePosixPath(dirname(COMPONENT_PATH), './foo.xd.component.html');
    expect(registerTemplatePath).toHaveBeenCalledWith(templatePath, COMPONENT_PATH);
    expect(ctx.addWatchFile).not.toHaveBeenCalled();
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
    expect(clearDependenciesForComponent).toHaveBeenCalledWith(COMPONENT_PATH);
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
    expect(injectTemplate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', CLIENT_STRATEGY.registration, undefined);
  });

  it('only type-checks the template, leaving the render function to the template module', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    const templatePath = resolvePosixPath(dirname(COMPONENT_PATH), './foo.xd.component.html');
    expect(compile).toHaveBeenCalledWith('template source', { baseDir: dirname(templatePath), shadowingMembers: ['name'], reactiveMembers: ['count'], customElements: [], cache: expect.any(Object) });
    // The baseDir resolves the @import paths used as metadata owner file keys, which are posix
    expect(compile).toHaveBeenCalledWith('template source', { baseDir: expect.not.stringContaining('\\'), shadowingMembers: ['name'], reactiveMembers: ['count'], customElements: [], cache: expect.any(Object) });
    expect(createTemplateModuleSpecifier).toHaveBeenCalledWith(templatePath, ['count'], ['name']);
  });

  it('extracts the metadata of the component and of the imported ones with the project compiler options', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
    const state = createState();
    const hook = createTransformHook(state);

    await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);
    await vi.mocked(compile).mock.calls[0][1].cache?.getOrInsert('Bar', '/src/bar.ts');
    await vi.mocked(compile).mock.calls[0][1].cache?.getImport('format', 'fmt', '/src', './format');

    expect(extractComponentsMetadataFromSourceFile).toHaveBeenCalledWith(expect.anything(), state.compilerOptions);
    expect(getMetadataOrExtract).toHaveBeenCalledWith('Bar', '/src/bar.ts', state.compilerOptions);
    expect(getImportOrExtract).toHaveBeenCalledWith('format', 'fmt', '/src', './format', state.compilerOptions);
  });

  it('extracts the signal members with the project compiler options, watching and registering the base class files they depend on', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(extractComponentMembers).mockReturnValue({ reactiveMembers: ['count'], shadowingMembers: [], dependencies: ['/src/base.ts', '/node_modules/lib/index.d.ts'] });
    const state = createState();
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    expect(extractComponentMembers).toHaveBeenCalledWith(expect.anything(), metadata.typescriptNodes.klass, state.compilerOptions);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/base.ts');
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/node_modules/lib/index.d.ts');
    expect(registerDependency).toHaveBeenCalledWith('/src/base.ts', COMPONENT_PATH);
    expect(registerDependency).toHaveBeenCalledWith('/node_modules/lib/index.d.ts', COMPONENT_PATH);
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
    expect(injectTemplate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', CLIENT_STRATEGY.registration, 'style-module');
  });

  it('injects the modules compiled for the server with the strategy of the server, type-checking nothing', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata({ styleUrl: './foo.css' })]]));

    const result = await createTransformHook(createState()).call(createPluginContext('server'), 'original code', COMPONENT_PATH, undefined);

    expect(injectTemplate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', SERVER_STRATEGY.registration, 'style-module');
    expect(compile).not.toHaveBeenCalled();
    expect(collectFileDiagnostics).not.toHaveBeenCalled();
    expect(registerRealFile).not.toHaveBeenCalled();
    expect(createShim).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ code: 'original code' }));
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

  it('watches and registers the files the type-check of the template depends on, the component file excluded', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
    vi.mocked(collectProjectDependencies).mockReturnValue([COMPONENT_PATH, '/src/foo/value.type.ts']);
    const state = createState();
    const hook = createTransformHook(state);
    const ctx = createPluginContext();

    await hook.call(ctx, 'original code', COMPONENT_PATH, undefined);

    expect(collectProjectDependencies).toHaveBeenCalledWith(PROGRAM, '/virtual/foo.__typecheck__.ts', state.compilerOptions);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/value.type.ts');
    expect(registerDependency).toHaveBeenCalledWith('/src/foo/value.type.ts', COMPONENT_PATH);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith(COMPONENT_PATH);
    expect(registerDependency).not.toHaveBeenCalledWith(COMPONENT_PATH, COMPONENT_PATH);
  });

  it('logs every semantic diagnostic and returns null when the shim reports errors', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    const metadata = createMetadata();
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', metadata]]));
    vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 2 } as ReturnType<typeof createShim>);
    vi.mocked(getLanguageService).mockReturnValue({
      getSemanticDiagnostics: vi.fn().mockReturnValue(['diag-1', 'diag-2']),
      getProgram: vi.fn().mockReturnValue(PROGRAM)
    } as unknown as ReturnType<typeof getLanguageService>);
    vi.mocked(describeDiagnostic).mockReturnValueOnce('first problem').mockReturnValueOnce('second problem');
    const state = createState();
    const hook = createTransformHook(state);

    const result = await hook.call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', expect.stringContaining('first problem'));
    expect(state.logError).toHaveBeenCalledWith('', expect.stringContaining('second problem'));
  });

  it('fails on a symbol the template imports under the name of a member of the component', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
    vi.mocked(createShim).mockReturnValue({ path: '/virtual/foo.__typecheck__.ts', bodyLineOffset: 2 } as ReturnType<typeof createShim>);
    const languageService = { getSemanticDiagnostics: vi.fn().mockReturnValue([]), getProgram: vi.fn().mockReturnValue(PROGRAM) };
    vi.mocked(getLanguageService).mockReturnValue(languageService as unknown as ReturnType<typeof getLanguageService>);
    vi.mocked(getImportConflictDiagnostics).mockReturnValueOnce(['conflict' as never]);
    vi.mocked(describeDiagnostic).mockReturnValueOnce('conflict problem');
    const state = createState();

    const result = await createTransformHook(state).call(createPluginContext(), 'original code', COMPONENT_PATH, undefined);

    expect(getImportConflictDiagnostics).toHaveBeenCalledWith(languageService, '/virtual/foo.__typecheck__.ts', 2);
    expect(result).toBeNull();
    expect(state.logError).toHaveBeenCalledWith('', expect.stringContaining('conflict problem'));
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

    expect(injectTemplate).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), expect.any(Map), 'FooComponent', 'template-module', CLIENT_STRATEGY.registration, undefined);
    expect(injectTemplate).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), expect.any(Map), 'BarComponent', 'template-module', CLIENT_STRATEGY.registration, undefined);
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

  describe('in a build', () => {
    it.each<[name: string, arrange: () => unknown, fileExists?: () => boolean]>([
      ['an option of the decorator is not a string literal', () => vi.mocked(findWebComponentErrors).mockReturnValue(['The templateUrl option of FooComponent must be a string literal'])],
      ['the selector is not a valid custom element name', () => vi.mocked(isValidCustomElementName).mockReturnValue(false)],
      ['the selector is already used by another component', () => vi.mocked(claimSelectors).mockResolvedValue('selector conflict')],
      ['the template cannot be found', () => undefined, () => false],
      ['the template compilation throws', () => vi.mocked(compile).mockRejectedValue(new Error('boom'))],
      ['injecting the template throws', () => vi.mocked(injectTemplate).mockImplementation(() => { throw new Error('inject failed'); })],
      ['the template has type errors', () => vi.mocked(getLanguageService).mockReturnValue({
        getSemanticDiagnostics: vi.fn().mockReturnValue(['diag-1']),
        getProgram: vi.fn().mockReturnValue(PROGRAM)
      } as unknown as ReturnType<typeof getLanguageService>)]
    ])('fails when %s', async (_name, arrange, fileExists = () => true) => {
      vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
      vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
      arrange();
      const ctx = createPluginContext();
      const hook = createTransformHook({ ...createState({ fileExists }), isBuild: true });

      await expect(hook.call(ctx, 'original code', COMPONENT_PATH, undefined)).rejects.toThrow(`Failed to compile component - ${COMPONENT_PATH}`);
      expect(ctx.error).toHaveBeenCalledOnce();
    });

    it('does not fail when the component compiles', async () => {
      vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
      vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
      const ctx = createPluginContext();
      const hook = createTransformHook({ ...createState(), isBuild: true });

      expect(await hook.call(ctx, 'original code', COMPONENT_PATH, undefined)).toEqual({ code: 'original code', map: expect.anything() });
      expect(ctx.error).not.toHaveBeenCalled();
    });
  });

  it('does not fail outside a build, where the errors are only reported', async () => {
    vi.mocked(readFile).mockResolvedValue('class FooComponent {}');
    vi.mocked(extractComponentsMetadataFromSourceFile).mockResolvedValue(new Map([['FooComponent', createMetadata()]]));
    vi.mocked(compile).mockRejectedValue(new Error('boom'));
    const ctx = createPluginContext();

    expect(await createTransformHook(createState()).call(ctx, 'original code', COMPONENT_PATH, undefined)).toBeNull();
    expect(ctx.error).not.toHaveBeenCalled();
  });
});
