import { Lexer, Parser, TokenType, generateRenderFunction } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `
  <label for={id} aria-label={label}>
    {label}
  </label>
  @if (id) {
    <span>Id is present</span>
  } @else {
    <span>Id is missing</span>
  }

  @for (let item of items) {
    <div>{item}</div>
  }

  @switch (status) {
    @case ('loading') {
      <div>Loading...</div>
    }
    
    @case ('error') {
      <div>Error!</div>
    }
    
    @default {
      <div>Content</div>
    }
  }
  <input id={id} type="text" value={ value + '' + 'asd' + ' ' + "test" } placeholder={placeholder} @change="onChange($event)" />
  `

export function compile(input: string): string {
  const tokens = new Lexer(input).tokenize();
  console.log(
    tokens.map(t => ({ type: TokenType[t.type], ...('parts' in t ? { parts: t.parts } : {}) }))
  );
  const ast = new Parser(tokens).parse();
  console.log(ast)
  let a = generateRenderFunction(ast)
  console.log(a)
  return a;
}

const filePath = 'test.js'
writeFileSync(filePath, compile(template));
