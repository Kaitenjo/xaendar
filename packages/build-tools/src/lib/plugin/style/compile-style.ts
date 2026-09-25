import { extname } from 'node:path';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { StyleCompileResult } from '../../types/style-compile-result.type';
import type { StyleCompiler } from '../../types/style-compiler.interface';

const styleCompilers: StyleCompiler[] = [
  {
    supports: (filePath) => extname(filePath) === '.css',
    compile: (entryPath, host) => ({
      cssText: normalizeCss(host.readFile(entryPath)),
      dependencyPaths: [entryPath]
    })
  }
];

/**
 * Compiles a style entry file into plain CSS and returns every file path the
 * owning component should watch.
 *
 * Today only plain `.css` is supported, but the returned dependency list is
 * designed to grow to transitive imports once preprocessors are introduced.
 */
export function compileStyle(entryPath: string, host: NodeCompilerHost): StyleCompileResult {
  const compiler = styleCompilers.find((item) => item.supports(entryPath));
  if (!compiler) {
    throw new Error(`Unsupported stylesheet extension "${extname(entryPath) || '(none)'}" for ${entryPath}.`);
  }

  return compiler.compile(entryPath, host);
}

function normalizeCss(css: string | undefined): string | undefined {
  return css && stripCssComments(css).trim();
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
