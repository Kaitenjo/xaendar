import { extname } from 'node:path';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { StyleCompileResult } from '../../types/style-compile-result.type';
import type { StyleCompiler } from '../../types/style-compiler.type';
import { compileLess } from './less/less.utils';
import { compileSass } from './sass/sass.utils';

/**
 * The compilers of the supported stylesheet formats. Sass and Less come from packages the project installs
 * only when it uses them, loaded on the first stylesheet that needs them.
 */
const styleCompilers: StyleCompiler[] = [
  {
    supports: (filePath) => extname(filePath) === '.css',
    compile: async (entryPath, host) => ({
      cssText: host.readFile(entryPath),
      dependencyPaths: [entryPath]
    })
  },
  {
    supports: (filePath) => ['.scss', '.sass'].includes(extname(filePath)),
    compile: compileSass
  },
  {
    supports: (filePath) => extname(filePath) === '.less',
    compile: compileLess
  }
];

/**
 * Compiles a style entry file into plain CSS and returns every file path the
 * owning component should watch: the entry, and for Sass and Less every file it imports.
 *
 * @param entryPath - Absolute path of the stylesheet.
 * @param host - Compiler host used to read the stylesheet.
 * @returns The CSS without comments, `undefined` if the stylesheet could not be read, and the files it was built from.
 * @throws If the extension of the stylesheet is not supported, its preprocessor is not installed, or it does not compile.
 */
export async function compileStyle(entryPath: string, host: NodeCompilerHost): Promise<StyleCompileResult> {
  const compiler = styleCompilers.find((item) => item.supports(entryPath));
  if (!compiler) {
    throw new Error(`Unsupported stylesheet extension "${extname(entryPath) || '(none)'}" for ${entryPath}.`);
  }

  const result = await compiler.compile(entryPath, host);
  result.cssText = normalizeCss(result.cssText);
  return result;
}

/**
 * Removes the comments of a stylesheet and trims it.
 *
 * @param css - The stylesheet, `undefined` if it could not be read.
 * @returns The normalized stylesheet, `undefined` if it could not be read.
 */
function normalizeCss(css: string | undefined): string | undefined {
  return css && stripCssComments(css).trim();
}

/**
 * Removes the block comments (`/* ... *\/`) of a stylesheet.
 *
 * @param css - The stylesheet.
 * @returns The stylesheet without comments.
 */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
