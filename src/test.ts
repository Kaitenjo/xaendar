import { generateRenderFunction, Lexer, Parser } from "@xendar/compiler";

export function compile(input: string): string {
  const tokens = new Lexer(input).tokenize();
  const ast = new Parser(tokens).parse();
  return generateRenderFunction(ast)
}

console.log(compile('<div> {message} </div>'))