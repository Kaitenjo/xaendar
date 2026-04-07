import { ASTNode, AttributeNode, CaseNode, ElementNode, ElseNode, EventNode, ForNode, IfNode, InterpolationNode, SwitchNode, TextNode } from "../parser/models/ast.type";
import { ASTNodeType } from "../parser/models/node.enum";

/**
 * Generates the TypeScript body of a render function from an AST.
 *
 * @param ast       Top-level AST nodes produced by the Parser
 * @param componentVar  Name of the component variable (default: `this`)
 * @returns         String containing the render function body
 */
export function generateRenderFunction(ast: ASTNode[], componentVar = "this"): string {
  const lines: string[] = [];

  lines.push(`const shadow = ${componentVar}.shadowRoot!;`);

  ast.forEach((node, i) => {
    lines.push(...processNode(node, `node${i}`, componentVar, 'shadow'));
  });

  return lines.join("\n");
}

/**
 * Generates code that appends `varName` to `parentVar`.
 * For flow control nodes no single var is produced; instead multiple children
 * are appended directly inside the control flow block.
 */
function processNode(node: ASTNode, varName: string, componentVar: string, parentVar: string): string[] {
  switch (node.type) {
    case ASTNodeType.Text:
      return processText(node as TextNode, varName, parentVar);

    case ASTNodeType.Interpolation:
      return processInterpolation(node as InterpolationNode, varName, componentVar, parentVar);

    case ASTNodeType.Element:
      return processElement(node as ElementNode, varName, componentVar, parentVar);

    case ASTNodeType.If:
      return processIf(node as IfNode, varName, componentVar, parentVar);

    case ASTNodeType.For:
      return processFor(node as ForNode, varName, componentVar, parentVar);

    case ASTNodeType.Switch:
      return processSwitch(node as SwitchNode, varName, componentVar, parentVar);

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
  const code = new Array<string>

  code.push(`const ${varName} = document.createElement(${JSON.stringify(node.tagName)});`);

  // Attributes
  node.attributes?.forEach((attr: AttributeNode) => {
    if (typeof attr.value === "string") {
      code.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, ${JSON.stringify(attr.value)});`);
    } else {
      const interp = attr.value as InterpolationNode;
      code.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, String(${componentVar}.${interp.expression}));`);
    }
  });

  // Events
  node.events?.forEach((event: EventNode) => {
    const evName = event.name.startsWith("@") ? event.name.slice(1) : event.name;
    code.push(`${varName}.addEventListener(${JSON.stringify(evName)}, ${componentVar}.${event.handler}.bind(${componentVar}));`);
  });

  // Children
  node.children?.forEach((child, idx) => {
    code.push(...processNode(child, `${varName}_c${idx}`, componentVar, varName));
  });

  code.push(`${parentVar}.appendChild(${varName});`);

  return code;
}

function processIf(node: IfNode, varName: string, componentVar: string, parentVar: string): string[] {
  const code = new Array<string>

  // Use a DocumentFragment as the mounting point for children inside the branch
  code.push(`if (${resolveExpression(node.condition, componentVar)}) {`);
  node.consequent.forEach((child, idx) => {
    code.push(...indent(processNode(child, `${varName}_t${idx}`, componentVar, parentVar)));
  });
  code.push(`}`);

  if (node.alternate) {
    const alt = node.alternate as ElseNode;
    code.push(`else {`);
    alt.children.forEach((child, idx) => {
      code.push(...indent(processNode(child, `${varName}_e${idx}`, componentVar, parentVar)));
    });
    code.push(`}`);
  }

  return code;
}

function processFor(node: ForNode, varName: string, componentVar: string, parentVar: string): string[] {
  const code = new Array<string>

  // expression is expected to be something like "item of items" or "item of this.items"
  const iterExpr = resolveExpression(node.expression, componentVar);

  code.push(`for (const ${iterExpr}) {`);
  node.children.forEach((child, idx) => {
    code.push(...indent(processNode(child, `${varName}_f${idx}`, componentVar, parentVar)));
  });
  code.push(`}`);

  return code;
}

function processSwitch(node: SwitchNode, varName: string, componentVar: string, parentVar: string): string[] {
  const code = new Array<string>

  code.push(`switch (${resolveExpression(node.expression, componentVar)}) {`);

  node.cases.forEach((c: CaseNode, cIdx) => {
    if (c.condition === null) {
      code.push(`  default:`);
    } else {
      code.push(`  case ${resolveExpression(c.condition, componentVar)}:`);
    }

    c.children.forEach((child, idx) => {
      code.push(...indent(indent(processNode(child, `${varName}_s${cIdx}_${idx}`, componentVar, parentVar))));
    });

    code.push(`    break;`);
  });

  code.push(`}`);

  return code;
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
  // Replace identifiers that look like component properties
  // Skips JS keywords and already-qualified expressions
  return expression.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, match => {
    if (JS_KEYWORDS.has(match) || match === componentVar) return match;
    return `${componentVar}.${match}`;
  }
  );
}

const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var',
  'void', 'while', 'with', 'yield'
]);

/**
 * Indents each line of a code block by two spaces.
 */
function indent(lines: string[]): string[] {
  return lines.map(l => `  ${l}`);
}
