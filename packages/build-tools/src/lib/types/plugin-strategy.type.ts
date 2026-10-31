import type { ServerCompileOptions } from '@xaendar/ssr-compiler';
import type { AsyncFunction, Function } from '@xaendar/types';
import type { ViteDevServer } from 'vite';
import type { RenderRegistration } from './render-registration.type';

/**
 * What the plugin does for the environments of a consumer of Vite: the functions compiling a template and generating
 * the template and style modules of a component, how the component registers them, and the work the environment does
 * besides. Chosen once per consumer: the ones of the browser or the ones of the server rendering.
 */
export type XaendarPluginStrategy = {
  /**
   * Wraps the compiled CSS of a style file into the source code of its style module.
   *
   * @param cssText - The compiled CSS, `undefined` when the style file has none.
   * @returns The source code of the style module.
   */
  readonly generateStyleModule: Function<[cssText: string | undefined], string>;
  /**
   * Compiles the source of a template into the code of its render functions.
   *
   * @param input - The source of the template.
   * @param options - The options of the compilation.
   * @returns The compiled code.
   * @throws A `TemplateError` if the template cannot be parsed or its code cannot be generated.
   */
  readonly compile: AsyncFunction<[input: string, options: ServerCompileOptions], string>;
  /**
   * Wraps the output of `compile` into the source code of the template module, exporting its `render` entry point.
   *
   * @param compiledFunctions - The output of `compile`.
   * @param dependencyPaths - The absolute paths of the modules imported by the template, imported first by the module.
   * @returns The source code of the template module.
   */
  readonly generateTemplateModule: Function<[compiledFunctions: string, dependencyPaths?: readonly string[]], string>;
  /**
   * The runtime function the component class calls to register its render function and its stylesheet, with the
   * package exporting it and the export of the style module holding the stylesheet.
   */
  readonly registration: RenderRegistration;
  /**
   * Whether the environment type-checks the components and the program: the server rendering leaves it to the
   * environment of the browser, which checks the same files.
   */
  readonly typeCheck: boolean;
  /**
   * Reacts, in the dev server, to the change of a file the environment evaluates: the server rendering reloads the page
   * when the browser does not evaluate the file. The browser has nothing to do.
   *
   * @param file - The changed file.
   * @param server - The dev server.
   */
  readonly hotUpdate?: Function<[file: string, server: ViteDevServer], void>;
};
