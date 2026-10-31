import { SSR_OUTLET } from '../../../utils/xaendar-config/xaendar-config.utils';
import { entryServerTs } from '../templates/entry-server-ts/entry-server-ts';
import { serverTs } from '../templates/server-ts/server-ts';
import type { ProjectRendering } from '../types/project-rendering.type';

/**
 * A project rendering its pages in the browser only: `index.html` holds the root component, and the application is
 * built into `dist`.
 */
export const CLIENT_RENDERING: ProjectRendering = {
  outDir: '../dist',
  body: componentName => `<${componentName}></${componentName}>`
};

/**
 * A project rendering its pages on the server too: `index.html` holds `<!--xd-ssr-->`, the application of the browser
 * is built into `dist/client`, next to the build of the server, and the project gets `@xaendar/ssr`, its entry
 * (`src/entry-server.ts`), its server (`server.ts`, which needs the types of Node) and the scripts running the server
 * and rendering the routes into HTML files.
 */
export const SERVER_RENDERING: ProjectRendering = {
  outDir: '../dist/client',
  body: () => SSR_OUTLET,
  scripts: { 
    prerender: 'xd prerender', 
    serve: 'node server.ts' 
  },
  packages: ['@xaendar/ssr'],
  devDependencies: { '@types/node': '^26.6.5' },
  ssr: { 
    entry: 'src/entry-server', 
    prerender: ['/'] 
  },
  rootFiles: componentName => [{ type: 'file', name: 'server.ts', content: serverTs(componentName) }],
  sourceFiles: componentName => [{ type: 'file', name: 'entry-server.ts', content: entryServerTs(componentName) }]
};
