import type { Style } from '../../../../types/style.type';
import type { ProjectRendering } from '../../types/project-rendering.type';

/**
 * Generates the content of the project root `index.html`.
 *
 * The body contains the root custom element derived from the project name
 * following the convention `<{name}-root>`. The entry point module is
 * loaded via a standard ES module script tag pointing to `src/main.ts`,
 * which Vite resolves during both dev and build. The global stylesheet is
 * linked too: Vite compiles it when it is a preprocessed format.
 *
 * The rendering of the project gives the body: a project rendering its pages on the server has `<!--xd-ssr-->` in
 * place of the root custom element, which the server replaces with the root component it renders.
 *
 * @param name - The project name, used to derive the root custom element
 *   selector (e.g. `my-app` → `<my-app-root>`).
 * @param style - The stylesheet format of the project, the extension of the global stylesheet.
 * @param rendering - Where the project renders its pages.
 * @returns The formatted HTML string.
 */
export function indexHtml(name: string, style: Style, rendering: Pick<ProjectRendering, 'body'>): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
    <link rel="stylesheet" href="./styles.${style}" />
    <script type="module" src="./main.ts"></script>
  </head>
  <body>
    ${rendering.body(name)}
  </body>
</html>`;
}
