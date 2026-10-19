import type { Style } from '../../../../utils/style/style';

/**
 * Generates the content of the project root `index.html`.
 *
 * The body contains the root custom element derived from the project name
 * following the convention `<{name}-root>`. The entry point module is
 * loaded via a standard ES module script tag pointing to `src/main.ts`,
 * which Vite resolves during both dev and build. The global stylesheet is
 * linked too: Vite compiles it when it is a preprocessed format.
 *
 * @param name - The project name, used to derive the root custom element
 *   selector (e.g. `my-app` → `<my-app-root>`).
 * @param style - The stylesheet format of the project, the extension of the global stylesheet.
 * @returns The formatted HTML string.
 */
export function indexHtml(name: string, style: Style): string {
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
    <${name}></${name}>
  </body>
</html>`;
}
