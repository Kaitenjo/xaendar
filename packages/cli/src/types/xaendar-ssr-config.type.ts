/**
 * The rendering on the server of a project, as its `xaendar.json` declares it.
 */
export type XaendarSsrConfig = {
  /**
   * The module rendering a page on the server, exporting `render(url)`, relative to the project and without extension
   * (`src/entry-server`).
   */
  entry: string;
  /**
   * The routes `xd prerender` renders into HTML files. Defaults to `['/']`.
   */
  prerender?: string[];
  /**
   * The folder the build of the server is written to, relative to the project. Defaults to `dist/server`.
   */
  outDir?: string;
};
