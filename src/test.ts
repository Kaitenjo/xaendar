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
<input id={id} type="text" value={value} placeholder={placeholder} @change="onChange($event)" />
`

compile(template)
