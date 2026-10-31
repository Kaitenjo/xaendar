import type { XaendarSsrConfig } from '../../../types/xaendar-ssr-config.type';
import type { Entry } from './entry.type';

/**
 * What a new project differs in, between rendering its pages in the browser only and rendering them on the server too:
 * chosen once by `xd new`, and read by the templates of its files.
 */
export type ProjectRendering = {
  /**
   * The folder the application of the browser is built into, relative to the root of Vite (`src`).
   */
  readonly outDir: string;
  /**
   * Generates the content of the body of `index.html`: the root component, or the comment the server replaces with
   * the page it renders.
   *
   * @param componentName - The selector of the root component.
   * @returns The HTML of the body.
   */
  readonly body: (componentName: string) => string;
  /**
   * The scripts of `package.json` besides the ones of every project.
   */
  readonly scripts?: Readonly<Record<string, string>>;
  /**
   * The Xaendar packages the application depends on besides the ones of every project, at the version of the CLI.
   */
  readonly packages?: readonly string[];
  /**
   * The development dependencies besides the ones of every project, with their version.
   */
  readonly devDependencies?: Readonly<Record<string, string>>;
  /**
   * The rendering on the server `xaendar.json` declares.
   */
  readonly ssr?: XaendarSsrConfig;
  /**
   * Generates the files of the root of the project besides the ones of every project.
   *
   * @param componentName - The selector of the root component.
   * @returns The files.
   */
  readonly rootFiles?: (componentName: string) => Entry[];
  /**
   * Generates the files of `src` besides the ones of every project.
   *
   * @param componentName - The selector of the root component.
   * @returns The files.
   */
  readonly sourceFiles?: (componentName: string) => Entry[];
};
