import { Command } from 'commander';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from 'vite';
import { buildProject } from '../../utils/build-project/build-project.utils';
import { readXaendarConfig, resolveSsrPaths, SSR_OUTLET } from '../../utils/xaendar-config/xaendar-config.utils';

/**
 * Creates and returns the `prerender` command (alias `p`), rendering the routes of the project into HTML files (see
 * {@link prerender}).
 *
 * @returns The configured `prerender` {@link Command} instance ready to be added to the root program.
 */
export function prerenderCommand(): Command {
  return new Command('prerender')
    .alias('p')
    .description('Build the project and render its routes into HTML files')
    .action(async () => await prerender());
}

/**
 * Builds the project and renders each route its `xaendar.json` lists (`"ssr": { "prerender": ["/", "/about"] }`, `/`
 * by default) into an HTML file of the build of the browser: its `index.html`, with the HTML `render(route)` of the
 * entry of the server returns in place of `<!--xd-ssr-->`, written as the `index.html` of the folder of the route, so
 * that a static server serves the pages already rendered. The page of `/` replaces the `index.html` of the build.
 *
 * Exits the process with code `1` when the project does not render on the server, or its entry does not export
 * `render`.
 *
 * @returns A promise resolving once every route is written.
 */
async function prerender(): Promise<void> {
  const ssr = readXaendarConfig()?.ssr;
  if (!ssr) {
    console.error('✖  The project does not render on the server: declare "ssr": { "entry": "src/entry-server" } in its xaendar.json.');
    process.exit(1);
  }

  await buildProject();

  const { root, build } = await resolveConfig({}, 'build');
  const clientDir = resolve(root, build.outDir);
  const template = await readFile(resolve(clientDir, 'index.html'), 'utf-8');
  const render: ((url: string) => Promise<string>) | undefined = (await import(pathToFileURL(resolveSsrPaths(ssr).builtEntry).href)).render;
  if (!render) {
    console.error(`✖  ${ssr.entry} does not export render(url): export the function rendering a page on the server.`);
    process.exit(1);
  }

  const routes = ssr.prerender ?? ['/'];
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const file = resolve(clientDir, `.${route}`, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    const rendered = await render(route);
    // A function, because a `$` in a replacement string is a pattern: the text of a page would change the page
    await writeFile(file, template.replace(SSR_OUTLET, () => rendered));
    console.log(`✔  ${route} → ${file}`);
  }
}
