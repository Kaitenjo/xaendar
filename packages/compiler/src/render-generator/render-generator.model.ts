import { ASTNode, ElementNode, ForNode, IfNode, InterpolationNode, SwitchNode, TextNode } from "../parser/models/ast.type";
import { ASTNodeType } from "../parser/models/node.enum";

/**
 * Generates the TypeScript body of a render function from an AST.
 *
 * @param ast       Top-level AST nodes produced by the Parser
 * @param componentVar  Name of the component variable (default: `this`)
 * @returns         String containing the render function body
 */
export function generateRenderFunction(ast: ASTNode[], componentVar = "this"): string {
  return [`
const shadow = ${componentVar}.shadowRoot!;
`,
  ...ast.map((node, i) => processNode(node, `node${i}`, componentVar, 'shadow')).flat()
  ].join("\n");
}

/**
 * Generates code that appends `varName` to `parentVar`.
 * For flow control nodes no single var is produced; instead multiple children
 * are appended directly inside the control flow block.
 */
function processNode(node: ASTNode, varName: string, componentVar: string, parentVar: string): string[] {
  switch (node.type) {
    case ASTNodeType.Text:
      return processText(node, varName, parentVar);

    case ASTNodeType.Interpolation:
      return processInterpolation(node, varName, componentVar, parentVar);

    case ASTNodeType.Element:
      return processElement(node, varName, componentVar, parentVar);

    case ASTNodeType.If:
      return processIf(node, varName, componentVar, parentVar);

    case ASTNodeType.For:
      return processFor(node, varName, componentVar, parentVar);

    case ASTNodeType.Switch:
      return processSwitch(node, varName, componentVar, parentVar);

    default:
      return [];
  }
}

function processText(node: TextNode, varName: string, parentVar: string): string[] {
  return [
    `const ${varName} = document.createTextNode(${JSON.stringify(node.value)});`,
    `${parentVar}.appendChild(${varName});`
  ];
}

function processInterpolation(node: InterpolationNode, varName: string, componentVar: string, parentVar: string): string[] {
  return [
    `const ${varName} = document.createTextNode(String(${componentVar}.${node.expression}));`,
    `${parentVar}.appendChild(${varName});`
  ];
}

function processElement(node: ElementNode, varName: string, componentVar: string, parentVar: string): string[] {
  return [
    `const ${varName} = document.createElement("${node.tagName}");`,
    ...(node.attributes?.map(attr => `${varName}.setAttribute('${attr.name}', ${typeof attr.value === "string" ? attr.value : `${componentVar}.${attr.value.expression}`});`) || []),
    ...(node.events?.map(event => `${varName}.addEventListener("${event.name}", ${componentVar}.${event.handler}.bind(${componentVar}));`) || []),
    `${parentVar}.appendChild(${varName});`,
    ...(node.children.map((child, i) => processNode(child, `${varName}_c${i}`, componentVar, varName)).flat())
  ];
}

function processIf(node: IfNode, varName: string, componentVar: string, parentVar: string): string[] {
  const code = [
    `if (${resolveExpression(node.condition, componentVar)}) {`,
    ...node.consequent.map((child, idx) => indent(...processNode(child, `${varName}_t${idx}`, componentVar, parentVar))).flat(),
    '}'
  ];

  const alt = node.alternate;
  if (alt) {
    // append 'else' to the closing brace of the 'if' block
    code[code.length - 1] += ' else {';
    code.push(
      ...alt.children.map((child, idx) => indent(...processNode(child, `${varName}_e${idx}`, componentVar, parentVar))).flat(),
      '}'
    );
  }

  return code;
}

function processFor(node: ForNode, varName: string, componentVar: string, parentVar: string): string[] {
  const iterExpr = resolveForExpression(node.expression, componentVar);
  return [
    `for (${iterExpr}) {`,
    ...node.children.map((child, idx) => indent(...processNode(child, `${varName}_f${idx}`, componentVar, parentVar))).flat(),
    '}'
  ];
}

function processSwitch(node: SwitchNode, varName: string, componentVar: string, parentVar: string): string[] {
  return [
    `switch (${resolveExpression(node.expression, componentVar)}) {`,
    ...node.cases.map(caseNode => ([
      ...indent(
        `${!caseNode.condition ? 'default' : `case ${caseNode.condition}`}: {`,
        ...caseNode.children.map((child, i) => indent(...processNode(child, `${varName}_s${i}_${i}`, componentVar, parentVar))).flat(),
        `${indent('break;')}`,
        `}`
      )
    ])).flat(),
    '}'
  ];
}


function resolveForExpression(expression: string, componentVar: string): string {
  const match = expression.match(/^let\s+(\w+)\s+of\s+(\w+)$/);
  
  if (!match) {
    throw new Error(`String "${expression}" does not match the structure "let X of Y"`);
  }
  
  const [, X, Y] = match;
  return `const ${X} of this.${Y}`;
}

/**
 * Resolves references to component properties inside expressions.
 * A bare identifier that is NOT a JS keyword is prefixed with `componentVar`.
 *
 * Examples (componentVar = "this"):
 *   "items"          →  "this.items"
 *   "item of items"  →  "item of this.items"
 *   "x > 0"          →  "this.x > 0"
 */
function resolveExpression(expression: string, componentVar: string): string {
  return expression.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, match => match === componentVar ? match : `${componentVar}.${match}`);
}

/**
 * Indents each line of a code block by two spaces.
 */
function indent(...lines: string[]): string[] {
  return lines.map(line => `  ${line}`);
}
