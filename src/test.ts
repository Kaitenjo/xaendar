import { Lexer, Parser, TokenType, generateRenderFunction } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `
  @if (true) {
    <span>Id 1 is present</span>
  }
  
  <span>Always present</span>
  `

export function compile(input: string): string {
  const tokens = new Lexer(input).tokenize();
  console.log(
    tokens.map(t => ({ type: TokenType[t.type], ...('parts' in t ? { parts: t.parts } : {}) }))
  );
  const ast = new Parser(tokens).parse();
  // console.log(ast)
  let a = generateRenderFunction(ast)
  // console.log(a)
  return a;
}

const filePath = 'test.js'
writeFileSync(filePath, compile(template));
