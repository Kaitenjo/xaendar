import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { resolvePosixPath } from '../../utils/path/path.utils';

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    compile: vi.fn()
  };
});

vi.mock('@xaendar/ssr-compiler', () => ({
  compileServer: vi.fn(),
  getServerDependencies: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  getMetadata: vi.fn(),
  registerMetadata: vi.fn()
}));

vi.mock('../plugin-utils/plugin.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../plugin-utils/plugin.utils')>();
  return {
    ...actual,
    getImportOrExtract: vi.fn(),
    getMetadataOrExtract: vi.fn()
  };
});

import { compile, type CompileOptions } from '@xaendar/compiler';
import { compileServer, getServerDependencies } from '@xaendar/ssr-compiler';
import type { PluginContext } from 'rolldown';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { createStyleModuleSpecifier, createTemplateModuleSpecifier, getImportOrExtract, getMetadataOrExtract } from '../plugin-utils/plugin.utils';
import { createLoadHook } from './load';

/**
 * `compile` as the load hook calls it: the overload compiling the render function only.
 */
const compileRender: (input: string, options: Omit<CompileOptions, 'baseDir'>) => Promise<string> = compile;

const TEMPLATE_PATH = '/src/foo/foo.xd.component.html';
const TEMPLATE_MODULE_ID = `\0${createTemplateModuleSpecifier(TEMPLATE_PATH, ['items', 'count'])}`;
const STYLE_PATH = '/src/foo/foo.css';
const STYLE_MODULE_ID = `\0${createStyleModuleSpecifier(STYLE_PATH)}`;

function createState(files: Record<string, string>): XaendarPluginState {
  return {
    host: {
      fileExists: vi.fn((path: string) => path in files),
      readFile: vi.fn((path: string) => files[path])
    } as unknown as NodeCompilerHost,
    compilerOptions: {},
    projectFileNames: [],
    customElements: [],
    strictEvents: true,
    minifyStyles: false,
    isBuild: false,
    root: '/project',
    staticReport: false,
    logInfo: vi.fn(),
    setLogger: vi.fn(),
    logError: vi.fn(),
    strategies: { client: CLIENT_STRATEGY, server: SERVER_STRATEGY }
  };
}

/**
 * Builds the context of the hook for an environment of the browser, or of the server.
 */
function createPluginContext(consumer: 'client' | 'server' = 'client'): PluginContext {
  return {
    addWatchFile: vi.fn(),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
    warn: vi.fn(),
    environment: { config: { consumer } }
  } as unknown as PluginContext;
}

async function load(state: XaendarPluginState, ctx: PluginContext, id: string) {
  return await createLoadHook(state).call(ctx, id);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(compileRender).mockResolvedValue('function render() {}');
  vi.mocked(getServerDependencies).mockImplementation(async (_input, dependencyPaths) => dependencyPaths);
  // Unless a test says otherwise, every import is a symbol of the file its path leads to
  vi.mocked(getImportOrExtract).mockImplementation(async (_imported, _local, baseDir, path) => ({ type: 'symbol', modulePath: resolvePosixPath(baseDir, path), reactive: false }));
});

describe('createLoadHook()', () => {
  it('ignores ids of other modules', async () => {
    const ctx = createPluginContext();

    expect(await load(createState({}), ctx, '/src/foo/foo.xd.component.ts')).toBeNull();
    expect(compile).not.toHaveBeenCalled();
  });

  it('compiles the template with the signals encoded in the id into a javascript module', async () => {
    const ctx = createPluginContext();

    const result = await load(createState({ [TEMPLATE_PATH]: 'template source' }), ctx, TEMPLATE_MODULE_ID);

    // The symbols the template imports are resolved against its directory
    expect(compile).toHaveBeenCalledWith('template source', { signals: ['count', 'items'], templateDir: '/src/foo', shadowingMembers: [], customElements: [], cache: { getOrInsert: expect.any(Function), getImport: expect.any(Function), set: registerMetadata } });
    expect(result).toEqual({ code: expect.stringContaining('function render() {}\n\nexport { render };'), map: { mappings: '' }, moduleType: 'js' });
    expect(ctx.addWatchFile).toHaveBeenCalledWith(TEMPLATE_PATH);
  });

  it('extracts the metadata of the imported components with the project compiler options', async () => {
    const state = { ...createState({ [TEMPLATE_PATH]: 'template source' }), compilerOptions: { baseUrl: '/src' } };

    await load(state, createPluginContext(), TEMPLATE_MODULE_ID);
    await vi.mocked(compile).mock.calls[0][1].cache?.getOrInsert('Foo', '/src/foo.ts');
    await vi.mocked(compile).mock.calls[0][1].cache?.getImport('format', 'fmt', '/src/foo', './format');

    expect(getMetadataOrExtract).toHaveBeenCalledWith('Foo', '/src/foo.ts', state.compilerOptions);
    expect(getImportOrExtract).toHaveBeenCalledWith('format', 'fmt', '/src/foo', './format', state.compilerOptions);
  });

  it('compiles a template of a library of the workspace with the custom elements of the library', async () => {
    const library = { name: '@acme/ui', root: '/src', entry: '/src/public-api.ts', ssr: true, customElements: ['sl-*'] };

    await load({ ...createState({ [TEMPLATE_PATH]: 'template source' }), customElements: ['other-*'], libraries: [library] }, createPluginContext(), TEMPLATE_MODULE_ID);

    expect(compile).toHaveBeenCalledWith('template source', expect.objectContaining({ customElements: ['sl-*'] }));
  });

  it('renders on the server the components of a library not rendering there as the ones rendering only in the browser', async () => {
    const library = { name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', ssr: false, customElements: [] };
    const card = { type: 'component', modulePath: '/ws/libraries/ui/src/card.xd.component.ts' };
    vi.mocked(getImportOrExtract).mockResolvedValue(card as never);

    await load({ ...createState({ [TEMPLATE_PATH]: 'template source' }), libraries: [library] }, createPluginContext(), TEMPLATE_MODULE_ID);

    expect(await vi.mocked(compile).mock.calls[0][1].cache?.getImport('Card', 'Card', '/src/foo', '@acme/ui')).toEqual({ ...card, clientOnly: {} });
  });

  it('watches the imported components that exist on disk', async () => {
    const existing = resolvePosixPath('/src/foo', './existing.xd.component.ts');
    const template = '@import { A } from \'./existing.xd.component.ts\'\n@import { B } from \'./missing.xd.component.ts\'\n<a-b></a-b>';
    const ctx = createPluginContext();

    await load(createState({ [TEMPLATE_PATH]: template, [existing]: '' }), ctx, TEMPLATE_MODULE_ID);

    expect(ctx.addWatchFile).toHaveBeenCalledWith(existing);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith(resolvePosixPath('/src/foo', './missing.xd.component.ts'));
  });

  it('imports, once and first, the existing modules the template imports, leaving out the declaration files', async () => {
    const existing = resolvePosixPath('/src/foo', './existing.xd.component.ts');
    const declaration = resolvePosixPath('/src/foo', './types.d.ts');
    const template = [
      '@import { A } from \'./existing.xd.component.ts\'',
      '@import { C } from \'./existing.xd.component.ts\'',
      '@import { B } from \'./missing.xd.component.ts\'',
      '@import { D } from \'./types.d.ts\'',
      '<a-b></a-b>'
    ].join('\n');

    const result = await load(createState({ [TEMPLATE_PATH]: template, [existing]: '', [declaration]: '' }), createPluginContext(), TEMPLATE_MODULE_ID);

    expect((result as { code: string }).code.startsWith(`import ${JSON.stringify(existing)};\nimport { _if,`)).toBe(true);
    expect((result as { code: string }).code).not.toContain('missing');
    expect((result as { code: string }).code).not.toContain('types.d.ts');
  });

  it('imports, and watches, the file declaring a component or a directive imported through a barrel, not the barrel', async () => {
    const barrel = resolvePosixPath('/src/foo', './ui/index.ts');
    const card = '/src/foo/ui/card/card.xd.component.ts';
    const tip = '/src/foo/ui/tip/tip.directive.ts';
    const template = '@import { Card, Tip } from \'./ui/index.ts\'\n@import lazy { Panel } from \'./ui/index.ts\'\n<x-card></x-card>';
    vi.mocked(getImportOrExtract).mockImplementation(async imported => ({
      Card: { type: 'component', modulePath: card },
      Tip: { type: 'directive', modulePath: tip },
      Panel: { type: 'component', modulePath: '/src/foo/ui/panel/panel.xd.component.ts' }
    } as never)[imported]);
    const ctx = createPluginContext();

    const result = await load(createState({ [TEMPLATE_PATH]: template, [barrel]: '' }), ctx, TEMPLATE_MODULE_ID);

    expect((result as { code: string }).code.startsWith(`import ${JSON.stringify(card)};\nimport ${JSON.stringify(tip)};\nimport { _if,`)).toBe(true);
    expect((result as { code: string }).code).not.toContain('index.ts');
    expect((result as { code: string }).code).not.toContain('panel');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(card);
    expect(ctx.addWatchFile).toHaveBeenCalledWith(tip);
    expect(ctx.addWatchFile).toHaveBeenCalledWith('/src/foo/ui/panel/panel.xd.component.ts');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(barrel);
  });

  it('imports no module of a package, whose declarations have no code', async () => {
    const template = '@import { formatPrice } from \'@acme/format\'\n<p></p>';
    vi.mocked(getImportOrExtract).mockResolvedValue({ type: 'symbol', modulePath: '/node_modules/@acme/format/index.js', importPath: '@acme/format', reactive: false });

    const result = await load(createState({ [TEMPLATE_PATH]: template, '/node_modules/@acme/format/index.js': '' }), createPluginContext(), TEMPLATE_MODULE_ID);

    expect((result as { code: string }).code.startsWith('import { _if,')).toBe(true);
  });

  it('raises an error when an import of the template cannot be resolved, watching the modules its paths lead to', async () => {
    const existing = resolvePosixPath('/src/foo', './existing.xd.component.ts');
    vi.mocked(getImportOrExtract).mockRejectedValue('boom');
    const ctx = createPluginContext();

    await expect(load(createState({ [TEMPLATE_PATH]: '@import { A } from \'./existing.xd.component.ts\'', [existing]: '' }), ctx, TEMPLATE_MODULE_ID)).rejects.toThrow(`Failed to compile template - ${TEMPLATE_PATH}\nboom`);
    expect(ctx.addWatchFile).toHaveBeenCalledWith(existing);
    expect(compile).not.toHaveBeenCalled();
  });

  it('does not import the modules of an @import lazy, still watching them', async () => {
    const lazy = resolvePosixPath('/src/foo', './lazy.xd.component.ts');
    const template = '@import lazy { A } from \'./lazy.xd.component.ts\'\n<a-b></a-b>';
    const ctx = createPluginContext();

    const result = await load(createState({ [TEMPLATE_PATH]: template, [lazy]: '' }), ctx, TEMPLATE_MODULE_ID);

    expect((result as { code: string }).code).not.toContain('lazy.xd.component');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(lazy);
  });

  it('compiles the template with the strategy of the server in an environment of the server, importing the modules the template imports first', async () => {
    const existing = resolvePosixPath('/src/foo', './existing.xd.component.ts');
    const template = '@import { A } from \'./existing.xd.component.ts\'\n<a-b></a-b>';
    vi.mocked(compileServer).mockResolvedValue('function render(out) {}');

    const result = await load(createState({ [TEMPLATE_PATH]: template, [existing]: '' }), createPluginContext('server'), TEMPLATE_MODULE_ID);

    expect(compileServer).toHaveBeenCalledWith(template, { signals: ['count', 'items'], templateDir: '/src/foo', shadowingMembers: [], customElements: [], cache: expect.any(Object) });
    expect(compile).not.toHaveBeenCalled();
    expect(result).toEqual({ code: `import ${JSON.stringify(existing)};\nfunction render(out) {}\n\nexport { render };\n`, map: { mappings: '' }, moduleType: 'js' });
  });

  it('imports on the server only the modules its strategy keeps', async () => {
    const existing = resolvePosixPath('/src/foo', './existing.xd.component.ts');
    const template = '@import { A } from \'./existing.xd.component.ts\'\n@client { <a-b></a-b> }';
    vi.mocked(compileServer).mockResolvedValue('function render(out) {}');
    vi.mocked(getServerDependencies).mockResolvedValue([]);

    const result = await load(createState({ [TEMPLATE_PATH]: template, [existing]: '' }), createPluginContext('server'), TEMPLATE_MODULE_ID);

    expect(getServerDependencies).toHaveBeenCalledWith(template, [existing], { templateDir: '/src/foo', cache: expect.any(Object) });
    expect(result).toEqual({ code: 'function render(out) {}\n\nexport { render };\n', map: { mappings: '' }, moduleType: 'js' });
  });

  it('raises an error when the modules the server imports cannot be resolved', async () => {
    vi.mocked(compileServer).mockResolvedValue('function render(out) {}');
    vi.mocked(getServerDependencies).mockRejectedValue('boom');

    await expect(load(createState({ [TEMPLATE_PATH]: 'template source' }), createPluginContext('server'), TEMPLATE_MODULE_ID)).rejects.toThrow(`Failed to compile template - ${TEMPLATE_PATH}\nboom`);
  });

  it('tells the server which components a static template renders hydrate by themselves', async () => {
    const islands = new Set(['x-counter']);
    const state = { ...createState({ [TEMPLATE_PATH]: 'template source' }), staticComponents: { islands: new Map([[TEMPLATE_PATH, islands]]) } } as unknown as XaendarPluginState;
    vi.mocked(compileServer).mockResolvedValue('function render(out) {}');

    await load(state, createPluginContext('server'), TEMPLATE_MODULE_ID);

    expect(compileServer).toHaveBeenCalledWith('template source', expect.objectContaining({ islands }));
  });

  it('says nothing about the globals of the browser in a project without the rendering on the server', async () => {
    const ctx = createPluginContext();

    await load(createState({ [TEMPLATE_PATH]: '{ document.title }' }), ctx, TEMPLATE_MODULE_ID);

    expect(ctx.warn).not.toHaveBeenCalled();
  });

  it('warns about the globals of the browser from the server only, in a project with the rendering on the server', async () => {
    const state = { ...createState({ [TEMPLATE_PATH]: '{ document.title } @client { a }' }), ssr: { entry: '/src/entry-server.ts' } };
    vi.mocked(compileServer).mockResolvedValue('function render(out) {}');
    const client = createPluginContext();
    const server = createPluginContext('server');

    await load(state, client, TEMPLATE_MODULE_ID);
    await load(state, server, TEMPLATE_MODULE_ID);

    expect(client.warn).not.toHaveBeenCalled();
    expect(server.warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('\'document\' exists only in the browser'));
  });

  it('exports the text of the stylesheet with the strategy of the server in an environment of the server', async () => {
    const result = await load(createState({ [STYLE_PATH]: '.a { color: red; }' }), createPluginContext('server'), STYLE_MODULE_ID);

    expect(result).toEqual({ code: 'export const css = ".a { color: red; }";\n', map: { mappings: '' }, moduleType: 'js' });
  });

  it('raises an error when the template cannot be read', async () => {
    const ctx = createPluginContext();

    await expect(load(createState({}), ctx, TEMPLATE_MODULE_ID)).rejects.toThrow(`Could not find template at ${TEMPLATE_PATH}`);
    expect(compile).not.toHaveBeenCalled();
  });

  it('raises an error when the template compilation fails', async () => {
    vi.mocked(compile).mockRejectedValue('boom');
    const ctx = createPluginContext();

    await expect(load(createState({ [TEMPLATE_PATH]: 'template source' }), ctx, TEMPLATE_MODULE_ID)).rejects.toThrow(`Failed to compile template - ${TEMPLATE_PATH}\nboom`);
  });

  it('compiles the style file encoded in the id into a javascript module exporting its stylesheet', async () => {
    const ctx = createPluginContext();

    const result = await load(createState({ [STYLE_PATH]: '/* comment */ .a { color: red; }' }), ctx, STYLE_MODULE_ID);

    expect(result).toEqual({ code: expect.stringContaining('sheet.replaceSync(".a { color: red; }");\n\nexport { sheet };'), map: { mappings: '' }, moduleType: 'js' });
    expect(ctx.addWatchFile).toHaveBeenCalledWith(STYLE_PATH);
    expect(compile).not.toHaveBeenCalled();
  });

  it('minifies the style when style minification is enabled', async () => {
    const ctx = createPluginContext();
    const state = { ...createState({ [STYLE_PATH]: '.a {\n  color: #ff0000;\n}' }), minifyStyles: true };

    const result = await load(state, ctx, STYLE_MODULE_ID);

    expect(result).toEqual({ code: expect.stringContaining('sheet.replaceSync(".a{color:red}");'), map: { mappings: '' }, moduleType: 'js' });
  });

  it('does not minify an unreadable style file even when style minification is enabled', async () => {
    const ctx = createPluginContext();

    const result = await load({ ...createState({}), minifyStyles: true }, ctx, STYLE_MODULE_ID);

    expect(result).toEqual({ code: 'export const sheet = undefined;\n', map: { mappings: '' }, moduleType: 'js' });
  });

  it('exports an undefined stylesheet when the style file cannot be read, still watching it', async () => {
    const ctx = createPluginContext();

    const result = await load(createState({}), ctx, STYLE_MODULE_ID);

    expect(result).toEqual({ code: 'export const sheet = undefined;\n', map: { mappings: '' }, moduleType: 'js' });
    expect(ctx.addWatchFile).toHaveBeenCalledWith(STYLE_PATH);
  });

  it('raises an error when the style compilation fails', async () => {
    const stylePath = '/src/foo/foo.unknown';
    const ctx = createPluginContext();

    await expect(load(createState({ [stylePath]: '' }), ctx, `\0${createStyleModuleSpecifier(stylePath)}`)).rejects.toThrow(`Failed to compile style - ${stylePath}\nError: Unsupported stylesheet extension ".unknown"`);
  });
});
