import { ASTNode, TextNode, InterpolationNode, ElementNode, AttributeNode, EventNode } from '../parser/models/ast.type';
import { ASTNodeType } from '../parser/models/node.enum';

/**
 * Genera il codice TypeScript della funzione render
 * @param ast L'albero AST del template
 * @param componentVar Nome della variabile 'this' del componente (di solito `this`)
 * @returns Stringa contenente il corpo della funzione render
 */
export function generateRenderFunction(ast: ASTNode[], componentVar = 'this'): string {
  const lines: string[] = [];

  // Apertura funzione
  lines.push(`const shadow = ${componentVar}.shadowRoot!;`);

  ast.forEach((node, i) => {
    lines.push(...processNode(node, `node${i}`, componentVar));
    lines.push(`shadow.appendChild(node${i});`);
  });

  return lines.join('\n');
}

/**
 * Genera il codice per creare un singolo nodo
 */
function processNode(node: ASTNode, varName: string, componentVar: string): string[] {
  const code = new Array<string>;

  switch (node.type) {
    case ASTNodeType.Text:
      code.push(`const ${varName} = document.createTextNode(${JSON.stringify((node as TextNode).value)});`);
      break;

    case ASTNodeType.Interpolation:
      code.push(`const ${varName} = document.createTextNode(${componentVar}.${(node as InterpolationNode).expression});`);
      break;

    case ASTNodeType.Element:
      const elNode = node as ElementNode;
      code.push(`const ${varName} = document.createElement(${JSON.stringify(elNode.tagName)});`);

      // Attributi
      (elNode.attributes || []).forEach((attr: AttributeNode) => {
        if (typeof attr.value === 'string') {
          code.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, ${JSON.stringify(attr.value)});`);
        } else {
          // Interpolazione come value
          const interp = attr.value as InterpolationNode;
          code.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, ${componentVar}.${interp.expression});`);
        }
      });

      // Eventi
      (elNode.events || []).forEach((event: EventNode) => {
        if (event.name.startsWith('@')) {
          event.name = event.name.slice(1);
        }
        code.push(`${varName}.addEventListener(${JSON.stringify(event.name)}, ${componentVar}.${event.handler}.bind(${componentVar}));`);
      });

      // Children
      (elNode.children || []).forEach((child, idx) => {
        const childVar = `${varName}_child${idx}`;
        code.push(...processNode(child, childVar, componentVar));
        code.push(`${varName}.appendChild(${childVar});`);
      });

      break;
  }

  return code;
}
