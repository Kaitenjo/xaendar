import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { generateRenderFunction } from "./render-generator/render-generator";

export function compile(input: string, cssVariableName?: string): string {
  const tokens = new Lexer(input).tokenize();
  const ast = new Parser(tokens).parse();
  return generateRenderFunction(ast, cssVariableName);
}