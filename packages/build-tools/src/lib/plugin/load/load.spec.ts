import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/plugin.types';
import { resolvePosixPath } from '../../utils/path/path.utils';

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    compile: vi.fn()
  };
});

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
import type { PluginContext } from 'rolldown';
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
    minifyStyles: false,
    isBuild: false,
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

function createPluginContext(): PluginContext {
  return {
    addWatchFile: vi.fn(),
    error: vi.fn((message: string) => {
      throw new Error(message);
    })
  } as unknown as PluginContext;
}

async function load(state: XaendarPluginState, ctx: PluginContext, id: string) {
  return await createLoadHook(state).call(ctx, id);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(compileRender).mockResolvedValue('function render() {}');
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

  it('does not import the modules of an @import lazy, still watching them', async () => {
    const lazy = resolvePosixPath('/src/foo', './lazy.xd.component.ts');
    const template = '@import lazy { A } from \'./lazy.xd.component.ts\'\n<a-b></a-b>';
    const ctx = createPluginContext();

    const result = await load(createState({ [TEMPLATE_PATH]: template, [lazy]: '' }), ctx, TEMPLATE_MODULE_ID);

    expect((result as { code: string }).code).not.toContain('lazy.xd.component');
    expect(ctx.addWatchFile).toHaveBeenCalledWith(lazy);
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
