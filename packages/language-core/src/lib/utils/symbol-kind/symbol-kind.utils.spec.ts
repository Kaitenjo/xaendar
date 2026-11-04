import { createProgram, createSourceFile, ScriptElementKind, ScriptTarget, type CompilerHost, type Program } from 'typescript';
import { describe, expect, it } from 'vitest';
import { getSymbolKind } from './symbol-kind.utils';

/**
 * The modules of the program, keyed by their path.
 */
const FILES: Readonly<Record<string, string>> = {
  '/main.ts': [
    'export class Shape { size = 1; }',
    'export enum Status { Active }',
    'export interface Row { id: number }',
    'export type Id = string;',
    'export function format() { return \'\'; }',
    'export const LIMIT = 10;',
    'export var legacy = 1;',
    'export namespace Tools { export const tool = 1; }',
    'export { LIMIT as MAX } from \'./other\';'
  ].join('\n'),
  '/other.ts': 'export const LIMIT = 10;'
};

/**
 * Creates a program holding {@link FILES} only.
 */
const createFilesProgram = (): Program => {
  const host = {
    getSourceFile: (fileName: string) => fileName in FILES ? createSourceFile(fileName, FILES[fileName], ScriptTarget.Latest, true) : undefined,
    fileExists: (fileName: string) => fileName in FILES,
    readFile: (fileName: string) => FILES[fileName],
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (fileName: string) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n'
  } as unknown as CompilerHost;

  return createProgram(['/main.ts'], { noLib: true }, host);
};

describe('getSymbolKind', () => {
  it('tells what each export declares, an alias being the symbol it stands for', () => {
    const program = createFilesProgram();
    const checker = program.getTypeChecker();
    const exported = checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile('/main.ts')!)!);

    expect(Object.fromEntries(exported.map(symbol => [symbol.name, getSymbolKind(checker, symbol)]))).toEqual({
      Shape: ScriptElementKind.classElement,
      Status: ScriptElementKind.enumElement,
      Row: ScriptElementKind.interfaceElement,
      Id: ScriptElementKind.typeElement,
      format: ScriptElementKind.functionElement,
      LIMIT: ScriptElementKind.constElement,
      legacy: ScriptElementKind.variableElement,
      Tools: ScriptElementKind.moduleElement,
      MAX: ScriptElementKind.constElement
    });
  });

  it('tells nothing of a symbol declaring none of the known kinds', () => {
    const program = createFilesProgram();
    const checker = program.getTypeChecker();
    const shape = checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile('/main.ts')!)!).find(({ name }) => name === 'Shape')!;
    const [size] = checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(shape));

    expect(getSymbolKind(checker, size)).toBe(ScriptElementKind.unknown);
  });
});
