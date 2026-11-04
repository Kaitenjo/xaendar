import type { TemplateAnalysisResult } from './template-analysis-result.type';

/**
 * A TypeScript project written in a temporary directory, for the specs analyzing real templates: a component `App`
 * extending `CustomElement` (an `HTMLElement`) using the template `src/app.html`, a component `Child` (`my-child`,
 * inheriting the event `closed` from `ChildBase`) and the directives `Tooltip` (`tooltip`) and `Media` (`media`). The
 * alias `@app/*` leads to the files of `src`, and the package `@acme/format` declares `formatPrice` and `CURRENCY`.
 */
export type FixtureProject = {
  /**
   * The root directory of the project, in posix format.
   */
  readonly root: string;
  /**
   * Returns the absolute path, in posix format, of a file of the project.
   */
  readonly path: (relativePath: string) => string;
  /**
   * Writes a file of the project.
   */
  readonly write: (relativePath: string, text: string) => void;
  /**
   * Analyzes a source as the template of `App`.
   */
  readonly analyze: (source: string) => Promise<TemplateAnalysisResult>;
  /**
   * Deletes the project.
   */
  readonly dispose: () => void;
};
