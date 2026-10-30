import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/plugin.types';

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    disposeLanguageService: vi.fn()
  };
});

vi.mock('@xaendar/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/compiler')>();
  return {
    ...actual,
    clearComponentMembersCache: vi.fn()
  };
});

vi.mock('../../registry/dependency-registry/dependency-registry', () => ({
  clearDependencyRegistry: vi.fn()
}));

vi.mock('../../registry/import-registry/import-registry', () => ({
  clearImportRegistry: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  clearMetadataRegistry: vi.fn()
}));

vi.mock('../../registry/style-registry/style-registry', () => ({
  clearStyleRegistry: vi.fn()
}));

vi.mock('../../registry/template-registry/template-registry', () => ({
  clearTemplateRegistry: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn()
}));

import { clearComponentMembersCache } from '@xaendar/compiler';
import { disposeLanguageService } from '@xaendar/language-core';
import { readFile } from 'node:fs/promises';
import { clearDependencyRegistry } from '../../registry/dependency-registry/dependency-registry';
import { clearImportRegistry } from '../../registry/import-registry/import-registry';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleRegistry } from '../../registry/style-registry/style-registry';
import { clearTemplateRegistry } from '../../registry/template-registry/template-registry';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { createConfigureServerHook } from './configure-server';
import type { MinimalPluginContextWithoutEnvironment, ViteDevServer } from 'vite';

/**
 * Builds a fresh `XaendarPluginState` with mocked `setLogger`/`logError`, for a test to assert on.
 *
 * @returns The mocked plugin state.
 */
function createState(): XaendarPluginState {
  return {
    host: {} as XaendarPluginState['host'],
    compilerOptions: {} as XaendarPluginState['compilerOptions'],
    projectFileNames: [],
    customElements: [],
    minifyStyles: false,
    isBuild: false,
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createConfigureServerHook()', () => {
  it('sets the active logger from the server config', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);
    const logger = { info: vi.fn() };

    hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger }, httpServer: null } as unknown as ViteDevServer);

    expect(state.setLogger).toHaveBeenCalledWith(logger);
  });

  it('does nothing else when there is no httpServer (e.g. middleware mode)', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);

    expect(() => {
      hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger: {} }, httpServer: null } as unknown as ViteDevServer);
    }).not.toThrow();

    expect(clearTemplateRegistry).not.toHaveBeenCalled();
  });

  it('clears every registry, disposes the language service and resets the logger on server close', () => {
    const state = createState();
    const hook = createConfigureServerHook(state);
    const handlers: Record<string, () => void> = {};
    const httpServer = { on: vi.fn((event: string, cb: () => void) => { handlers[event] = cb; }) };

    hook.call({} as unknown as MinimalPluginContextWithoutEnvironment, { config: { logger: {} }, httpServer } as unknown as ViteDevServer);

    expect(httpServer.on).toHaveBeenCalledWith('close', expect.any(Function));

    handlers.close();

    expect(clearTemplateRegistry).toHaveBeenCalledTimes(1);
    expect(clearStyleRegistry).toHaveBeenCalledTimes(1);
    expect(clearImportRegistry).toHaveBeenCalledTimes(1);
    expect(clearMetadataRegistry).toHaveBeenCalledTimes(1);
    expect(clearDependencyRegistry).toHaveBeenCalledTimes(1);
    expect(clearComponentMembersCache).toHaveBeenCalledTimes(1);
    expect(disposeLanguageService).toHaveBeenCalledTimes(1);
    expect(state.setLogger).toHaveBeenLastCalledWith(undefined);
    expect(state.server).toBeUndefined();
  });

  it('keeps the dev server, adding no middleware when the plugin does not render on the server', () => {
    const state = createState();
    const server = { config: { logger: {} }, httpServer: null } as unknown as ViteDevServer;

    const post = createConfigureServerHook(state).call({} as unknown as MinimalPluginContextWithoutEnvironment, server);

    expect(state.server).toBe(server);
    expect(post).toBeUndefined();
  });

  describe('rendering on the server', () => {
    /**
     * A request handled by the middleware, with its response.
     */
    type Exchange = {
      response: { statusCode: number, setHeader: ReturnType<typeof vi.fn>, end: ReturnType<typeof vi.fn> },
      next: ReturnType<typeof vi.fn>
    };

    /**
     * Configures a dev server whose entry renders the page with the given function, returning the middleware the plugin adds.
     */
    function configure(render: (url: string) => Promise<string>) {
      const middlewares = new Array<(request: unknown, response: unknown, next: unknown) => Promise<void>>();
      const server = {
        config: { logger: {}, root: '/project/src' },
        httpServer: null,
        middlewares: { use: vi.fn((middleware: typeof middlewares[number]) => middlewares.push(middleware)) },
        transformIndexHtml: vi.fn(async (_url: string, html: string) => html.replace('<head>', '<head><script type="module" src="/@vite/client"></script>')),
        ssrLoadModule: vi.fn(async () => ({ render })),
        ssrFixStacktrace: vi.fn()
      };
      const state = { ...createState(), ssr: { entry: 'entry-server.ts' } };
      const post = createConfigureServerHook(state).call({} as unknown as MinimalPluginContextWithoutEnvironment, server as unknown as ViteDevServer) as () => void;
      post();

      /**
       * Sends a request to the middleware, recording its original URL as the server of Vite does unless told otherwise.
       */
      const request = async (method: string, accept: string | undefined, url = '/about', recordsOriginalUrl = true): Promise<Exchange> => {
        const response = { statusCode: 0, setHeader: vi.fn(), end: vi.fn() };
        const next = vi.fn();
        await middlewares[0]({ method, headers: { accept }, originalUrl: recordsOriginalUrl ? url : undefined, url }, response, next);
        return { response, next };
      };

      return { server, request };
    }

    beforeEach(() => {
      vi.mocked(readFile).mockResolvedValue('<html><head></head><body><!--xd-ssr--></body></html>' as never);
    });

    it('renders a page asking for HTML with the entry, in place of the outlet of index.html transformed by the plugins', async () => {
      const { server, request } = configure(async url => `<app-root>${url}</app-root>`);

      const { response, next } = await request('GET', 'text/html,application/xhtml+xml');

      expect(readFile).toHaveBeenCalledWith(resolvePosixPath('/project/src', 'index.html'), 'utf-8');
      expect(server.ssrLoadModule).toHaveBeenCalledWith(resolvePosixPath('/project/src', 'entry-server.ts'));
      expect(response.statusCode).toBe(200);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(response.end).toHaveBeenCalledWith('<html><head><script type="module" src="/@vite/client"></script></head><body><app-root>/about</app-root></body></html>');
      expect(next).not.toHaveBeenCalled();
    });

    it('renders the URL of the request when no original one is recorded', async () => {
      const { request } = configure(async url => `<app-root>${url}</app-root>`);

      const { response } = await request('GET', 'text/html', '/team', false);

      expect(response.end).toHaveBeenCalledWith(expect.stringContaining('<app-root>/team</app-root>'));
    });

    it('keeps as they are the sequences with a dollar in the text of a page', async () => {
      const page = '<p>$& $\' $` $$</p>';
      const { request } = configure(async () => page);

      const { response } = await request('GET', 'text/html');

      expect(response.end).toHaveBeenCalledWith(`<html><head><script type="module" src="/@vite/client"></script></head><body>${page}</body></html>`);
    });

    it('leaves to the next middleware a request not asking for HTML', async () => {
      const { server, request } = configure(async () => '');

      const post = await request('POST', 'text/html');
      const json = await request('GET', 'application/json');
      const none = await request('GET', undefined);

      expect(post.next).toHaveBeenCalledWith();
      expect(json.next).toHaveBeenCalledWith();
      expect(none.next).toHaveBeenCalledWith();
      expect(server.ssrLoadModule).not.toHaveBeenCalled();
    });

    it('fixes the stack trace of an error of the rendering, handing it to the next middleware', async () => {
      const error = new Error('render failed');
      const { server, request } = configure(async () => {
        throw error;
      });

      const { response, next } = await request('GET', 'text/html');

      expect(server.ssrFixStacktrace).toHaveBeenCalledWith(error);
      expect(next).toHaveBeenCalledWith(error);
      expect(response.end).not.toHaveBeenCalled();
    });

    it('hands to the next middleware what the rendering throws, with no stack trace to fix when it is not an error', async () => {
      const { server, request } = configure(async () => {
        throw 'render failed';
      });

      const { next } = await request('GET', 'text/html');

      expect(server.ssrFixStacktrace).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith('render failed');
    });
  });
});
