import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { NodeCompilerHost } from '../../../models/node-compiler-host/node-compiler-host.model';
import type { StyleCompileResult } from '../../../types/style-compile-result.type';
import { toPosixPath } from '../../../utils/path/path.utils';
import { loadPreprocessor } from '../load-preprocessor/load-preprocessor.utils';

/**
 * Compiles a `.scss` file, or a `.sass` file written in the indented syntax, with the `sass` package
 * installed by the project.
 *
 * The entry is read through the host, while the files it loads with `@use`, `@forward` and `@import`
 * are read from disk by Sass, relative to the entry: all of them are returned as dependencies.
 *
 * @param entryPath - Absolute path of the stylesheet.
 * @param host - Compiler host used to read the stylesheet.
 * @returns The compiled CSS, `undefined` if the stylesheet could not be read, and the files it was built from.
 * @throws If the `sass` package is not installed, or the stylesheet does not compile.
 */
export async function compileSass(entryPath: string, host: NodeCompilerHost): Promise<StyleCompileResult> {
  const source = host.readFile(entryPath);
  if (source === undefined) {
    return { cssText: undefined, dependencyPaths: [entryPath] };
  }

  const sass = await loadPreprocessor('sass', () => import('sass'), entryPath);
  const { css, loadedUrls } = sass.compileString(source, {
    url: pathToFileURL(entryPath),
    syntax: extname(entryPath) === '.sass' ? 'indented' : 'scss'
  });

  /*
    Sass reports the entry among the loaded files: the set keeps it once, and first. Without custom importers
    every loaded file is a `file:` URL, the built-in modules (`sass:math`) are not reported.
  */
  const dependencyPaths = new Set([entryPath]);
  for (let i = 0; i < loadedUrls.length; i++) {
    dependencyPaths.add(toPosixPath(fileURLToPath(loadedUrls[i])));
  }

  return { cssText: css, dependencyPaths: Array.from(dependencyPaths) };
}
