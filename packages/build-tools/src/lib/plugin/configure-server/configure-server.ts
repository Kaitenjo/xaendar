import { clearComponentMembersCache } from '@xaendar/compiler';
import { disposeLanguageService } from '@xaendar/language-core';
import { readFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import type { Connect, HookHandler, Plugin, ViteDevServer } from 'vite';
import { SSR_OUTLET } from '../../costants/ssr-outlet';
import { clearDependencyRegistry } from '../../registry/dependency-registry/dependency-registry';
import { clearImportRegistry } from '../../registry/import-registry/import-registry';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleRegistry } from '../../registry/style-registry/style-registry';
import { clearTemplateRegistry } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import { resolvePosixPath } from '../../utils/path/path.utils';

/**
 * Vite plugin `configureServer` hook: captures the dev server and its logger and, once the
 * HTTP server closes, clears every registry, the signal members cache and the
 * language service so a fresh dev server run starts from a clean state.
 *
 * When the plugin renders on the server, it adds the middleware rendering each page (see {@link renderPage}), after
 * the ones of Vite, so that it only receives the requests no other middleware serves.
 *
 * @param state - The shared plugin state, whose logger and server are set on configure and reset on close.
 * @returns The `configureServer` hook handler.
 */
export function createConfigureServerHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['configureServer']>> {
  return function configureServer(server) {
    state.setLogger(server.config.logger);
    state.server = server;
    server.httpServer?.on('close', () => {
      clearTemplateRegistry();
      clearStyleRegistry();
      clearImportRegistry();
      clearMetadataRegistry();
      clearDependencyRegistry();
      clearComponentMembersCache();
      disposeLanguageService();
      state.setLogger(undefined);
      state.server = undefined;
    });

    const ssr = state.ssr;
    return ssr 
      ? () => server.middlewares.use((request, response, next) => renderPage(server, ssr.entry, request, response, next)) 
      : undefined;
  };
}

/**
 * Renders a page on the server, as the server of the application does in production: the `index.html` of the root of
 * Vite, transformed by the plugins, with the HTML `render(url)` of the entry returns in place of `<!--xd-ssr-->`. The
 * entry is loaded through the server module graph of Vite, so that it and the components it renders follow the changes
 * of their files. A request not asking for HTML is left to the next middleware, and so is an error, once its stack
 * trace points to the sources.
 *
 * @param server - The dev server.
 * @param entry - The module rendering a page, absolute or relative to the root of Vite.
 * @param request - The request.
 * @param response - The response.
 * @param next - Hands the request, or an error, to the next middleware.
 */
async function renderPage(server: ViteDevServer, entry: string, request: Connect.IncomingMessage, response: ServerResponse, next: Connect.NextFunction): Promise<void> {
  if (request.method !== 'GET' || !request.headers.accept?.includes('text/html')) {
    next();
    return;
  }

  try {
    const url = request.originalUrl ?? request.url!;
    const template = await server.transformIndexHtml(url, await readFile(resolvePosixPath(server.config.root, 'index.html'), 'utf-8'));
    const render: (url: string) => string | Promise<string> = (await server.ssrLoadModule(resolvePosixPath(server.config.root, entry))).render;
    const rendered = await render(url);
    // A function, because a `$` in a replacement string is a pattern: the text of a page would change the page
    const html = template.replace(SSR_OUTLET, () => rendered);
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html');
    response.end(html);
  } catch (error) {
    if (error instanceof Error) {
      server.ssrFixStacktrace(error);
    }
    next(error);
  }
}
