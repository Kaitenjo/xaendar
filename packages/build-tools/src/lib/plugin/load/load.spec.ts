import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/plugin.types';

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

import { compile } from '@xaendar/compiler';
import type { PluginContext } from 'rolldown';
import { registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import { createTemplateModuleSpecifier, getMetadataOrExtract } from '../plugin-utils/plugin.utils';
import { createLoadHook } from './load';

const TEMPLATE_PATH = '/src/foo/foo.xd.component.html';
const TEMPLATE_MODULE_ID = `\0${createTemplateModuleSpecifier(TEMPLATE_PATH, ['items', 'count'])}`;

function createState(files: Record<string, string>): XaendarPluginState {
  return {
    host: {
      fileExists: vi.fn((path: string) => path in files),
      readFile: vi.fn((path: string) => files[path])
    } as unknown as NodeCompilerHost,
    compilerOptions: {},
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
  vi.mocked(compile).mockResolvedValue('function render() {}');
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

    expect(compile).toHaveBeenCalledWith('template source', { signals: ['count', 'items'], cache: { getOrInsert: getMetadataOrExtract, set: registerMetadata } });
    expect(result).toEqual({ code: expect.stringContaining('function render() {}\n\nexport { render };'), moduleType: 'js' });
    expect(ctx.addWatchFile).toHaveBeenCalledWith(TEMPLATE_PATH);
  });

  it('watches the imported components that exist on disk', async () => {
    const existing = resolve('/src/foo', './existing.xd.component.ts');
    const template = '@import { A } from \'./existing.xd.component.ts\'\n@import { B } from \'./missing.xd.component.ts\'\n<a-b></a-b>';
    const ctx = createPluginContext();

    await load(createState({ [TEMPLATE_PATH]: template, [existing]: '' }), ctx, TEMPLATE_MODULE_ID);

    expect(ctx.addWatchFile).toHaveBeenCalledWith(existing);
    expect(ctx.addWatchFile).not.toHaveBeenCalledWith(resolve('/src/foo', './missing.xd.component.ts'));
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
});
