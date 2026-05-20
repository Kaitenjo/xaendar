import { Lexer, Parser, TokenType, generateRenderFunction } from "@xaendar/compiler";
import { writeFileSync } from "fs";

// const template = `
//   <label for={id} aria-label={label}>
//     {label}
//   </label>
//   @const test = user.name;
  
//   @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
//     @const test2 = user.name;
//     @const test3 = user.name;
//     <span>Id is present</span>
//   } @else if (true) {
//     <span>Id is missing</span>
//     @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
//       @const test2 = user.name;
//       @const test3 = user.name;
//       <span>Id is present</span>
//     } @else {
//       <span>Id is missing</span>
//       @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
//         @const test2 = user.name;
//         @const test3 = user.name;
//         <span>Id is present</span>
//       } @else {
//         <span>Id is missing</span>
//       }
//     }
//   }
      
//   @for (item of items; track item.id; $index = i) {
//     @const test3 = user.name;
//     <div>{item}</div>
//   }

//   @switch (status) {
//     @case ('loading') {
//       <div>Loading...</div>
//     }
    
//     @case ('error') {
//       <div>Error!</div>
//     }
    
//     @default {
//       <div>Content</div>
//     }
//   }
//   <input id={id} type="text" value={ value + '' + 'asd' + ' ' + "test" } placeholder={placeholder} @change="onChange($event)" />
//   `

const template = `
  @if (status === 1) {
    <div>One</div>
  } @else if (status === 2) {
    <div>Two</div>
  } @else if (status === 3) {
    <div>Three</div>
  } @else {
    <div>Other</div>
  }
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
