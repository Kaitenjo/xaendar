/**
 * The rendering on the server of a project, as its `xaendar.json` declares it.
 */
export type XaendarSsrConfig = {
  /**
   * The module rendering a page on the server, exporting `render(url)`, `url` being the path of the request with its
   * query string, relative to the project and without extension (`src/entry-server`).
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
  /**
   * Whether `xd build` and `xd prerender` find the static components, which they leave out of the bundle of the
   * browser: worth it in a multi-page application, not in a single-page one. Defaults to `false`.
   */
  staticComponents?: boolean;
};
