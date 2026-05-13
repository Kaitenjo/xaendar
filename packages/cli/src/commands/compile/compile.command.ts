import { Lexer, Parser, generateRenderFunction } from '@xaendar/compiler';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';

/**
 * Compiles a single `.xd.component.html` template file into a TypeScript
 * render-function string and writes the result to a `.js` output file.
 *
 * @param inputPath - Absolute or relative path to the HTML template to compile.
 * @param outputPath - Absolute or relative path for the emitted output file.
 *   Defaults to the input path with the extension replaced by `.render.js`.
 */
export function compileFile(inputPath: string, outputPath?: string): void {
  const absInput = resolve(process.cwd(), inputPath);
  const absOutput = outputPath
    ? resolve(process.cwd(), outputPath)
    : resolve(dirname(absInput), `${basename(absInput, extname(absInput))}.render.js`);

  let source: string;
  try {
    source = readFileSync(absInput, 'utf8');
  } catch {
    console.error(`✖  Cannot read file: ${absInput}`);
    process.exit(1);
  }

  const result = compile(source);

  writeFileSync(absOutput, result, 'utf8');
  console.log(`✔  Compiled: ${inputPath} → ${absOutput}`);
}

/**
 * Runs the full compiler pipeline (lexer → parser → render-generator) on a
 * raw template string and returns the generated TypeScript/JavaScript source.
 *
 * @param source - The raw HTML template string to compile.
 * @returns The generated render-function source code as a string.
 */
export function compile(source: string): string {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  return generateRenderFunction(ast);
}
