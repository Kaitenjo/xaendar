import { ASTNode, ElementNode, ForNode, IfNode, InterpolationNode, SwitchNode, TextNode } from "../parser/models/ast.type.js";
import { ASTNodeType } from "../parser/models/node.enum.js";

class Context {
  
  constructor(
    private _identifiers = new Array<string>,
    private _parent?: Context
  ) { }

  public getIdentifier(): string | undefined {
    return this._identifiers[this._identifiers.length - 1] || this._parent?.getIdentifier();
  }
}

/**
 * Generates the TypeScript body of a render function from an AST.
 *
 * @param ast       Top-level AST nodes produced by the Parser
 * @param componentVar  Name of the component variable (default: `this`)
 * @returns         String containing the render function body
 */
export function generateRenderFunction(ast: ASTNode[]): string {
  return [`
const shadow = this.shadowRoot!;
`,
  ...ast.map((node, i) => processNode(node, `node${i}`, 'shadow', new Context)).flat()
  ].join("\n");
}

/**
 * Generates code that appends `nodeName` to `parentNode`.
 * For flow control nodes no single var is produced; instead multiple children
 * are appended directly inside the control flow block.
 */
function processNode(node: ASTNode, nodeName: string, parentNode: string, context: Context): string[] {
  switch (node.type) {
    case ASTNodeType.Text:
    case ASTNodeType.Interpolation:
      return processTextAndInterpolation(node, nodeName, parentNode, context);

    case ASTNodeType.Element:
      return processElement(node, nodeName, parentNode, context);

    case ASTNodeType.If:
      return processIf(node, nodeName, parentNode, context);

    case ASTNodeType.For:
      return processFor(node, nodeName, parentNode, context);

    case ASTNodeType.Switch:
      return processSwitch(node, nodeName, parentNode, context);

    default:
      return [];
  }
}

function processTextAndInterpolation(node: TextNode | InterpolationNode, nodeName: string, parentNode: string, context: Context): string[] {
  const textValue = node.type === ASTNodeType.Text ? JSON.stringify(node.value) : resolveExpression(node.expression);
  return [
    `const ${nodeName} = document.createTextNode(${textValue});`,
    `${parentNode}.appendChild(${nodeName});`
  ];
}

function processElement(node: ElementNode, nodeName: string, parentNode: string, context: Context): string[] {
  return [
    `const ${nodeName} = document.createElement("${node.tagName}");`,
    ...(node.attributes?.map(attr => `${nodeName}.setAttribute('${attr.name}', ${typeof attr.value === "string" ? attr.value : `this.${attr.value.expression}`});`) || []),
    ...(node.events?.map(event => `${nodeName}.addEventListener("${event.name}", this.${event.handler}.bind(this));`) || []),
    `${parentNode}.appendChild(${nodeName});`,
    ...(node.children.map((child, i) => processNode(child, `${nodeName}_c${i}`, nodeName)).flat())
  ];
}

function processIf(node: IfNode, nodeName: string, parentNode: string, context: Context): string[] {
  const code = [
    `if (${resolveExpression(node.condition)}) {`,
    ...node.consequent.map((child, idx) => indent(...processNode(child, `${nodeName}_t${idx}`, parentNode, context))).flat(),
    '}'
  ];

  const alt = node.alternate;
  if (alt) {
    // append 'else' to the closing brace of the 'if' block
    code[code.length - 1] += ' else {';
    code.push(
      ...alt.children.map((child, idx) => indent(...processNode(child, `${nodeName}_e${idx}`, parentNode, context))).flat(),
      '}'
    );
  }

  return code;
}

function processFor(node: ForNode, nodeName: string, parentNode: string, parentContext: Context): string[] {
  const iterExpr = resolveForExpression(node.expression);
  parentContext = new Context([iterExpr], parentContext);
  return [
    `for (${iterExpr}) {`,
    ...node.children.map((child, idx) => indent(...processNode(child, `${nodeName}_f${idx}`, parentNode, context))).flat(),
    '}'
  ];
}

function processSwitch(node: SwitchNode, nodeName: string, parentNode: string, context: Context): string[] {
  return [
    `switch (${resolveExpression(node.expression)}) {`,
    ...node.cases.map(caseNode => ([
      ...indent(
        `${!caseNode.condition ? 'default' : `case ${caseNode.condition}`}: {`,
        ...caseNode.children.map((child, i) => indent(...processNode(child, `${nodeName}_s${i}_${i}`, parentNode, context))).flat(),
        `${indent('break;')}`,
        `}`
      )
    ])).flat(),
    '}'
  ];
}


function resolveForExpression(expression: string): string {
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
function resolveExpression(expression: string): string {
  return expression.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, match => match === 'this' ? match : `this.${match}`);
}

/**
 * Indents each line of a code block by two spaces.
 */
function indent(...lines: string[]): string[] {
  return lines.map(line => `  ${line}`);
}
