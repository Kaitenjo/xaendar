import type { NodeCompilerHost } from '../../../models/node-compiler-host/node-compiler-host.model';
import type { StyleCompileResult } from '../../../types/style-compile-result.type';
import { toPosixPath } from '../../../utils/path/path.utils';
import { loadPreprocessor } from '../load-preprocessor/load-preprocessor.utils';

/**
 * Compiles a `.less` file with the `less` package installed by the project.
 *
 * The entry is read through the host, while the files it loads with `@import` are read from disk by
 * Less, relative to the entry: all of them are returned as dependencies.
 *
 * @param entryPath - Absolute path of the stylesheet.
 * @param host - Compiler host used to read the stylesheet.
 * @returns The compiled CSS, `undefined` if the stylesheet could not be read, and the files it was built from.
 * @throws If the `less` package is not installed, or the stylesheet does not compile.
 */
export async function compileLess(entryPath: string, host: NodeCompilerHost): Promise<StyleCompileResult> {
  const source = host.readFile(entryPath);
  if (source === undefined) {
    return { cssText: undefined, dependencyPaths: [entryPath] };
  }

  const { default: less } = await loadPreprocessor('less', () => import('less'), entryPath);
  const { css, imports } = await less.render(source, { filename: entryPath });

  // Unlike Sass, Less does not report the entry among the imported files
  const dependencyPaths = [entryPath];
  for (let i = 0; i < imports.length; i++) {
    dependencyPaths.push(toPosixPath(imports[i]));
  }

  return { cssText: css, dependencyPaths };
}
