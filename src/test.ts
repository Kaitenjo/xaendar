import { generateRenderFunction, Lexer, Parser } from "@xendar/compiler";

export function compile(input: string): string {
  const tokens = new Lexer(input).tokenize();
  console.log(tokens)
  const ast = new Parser(tokens).parse();
  console.log(ast)
  let a = generateRenderFunction(ast)
  console.log(a)
  return a;
}

const template =`
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

compile(template)
