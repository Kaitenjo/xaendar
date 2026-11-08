import { type ASTNode, forEachExpressionChild, getTemplateSpan, isBrowserOnlyGlobal } from '@xaendar/compiler';
import { type Expression, type Identifier, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, isTypeOfExpression, type Node } from 'typescript';
import type { TemplateWarning } from '../types/template-warning.type';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * Finds what a template of a project rendering on the server compiles with, but cannot do there, the same warnings for
 * the terminal and for the editor: the reads of the globals only the browser has among the expressions the server
 * renders. The names the template or the component declare are not globals.
 *
 * @param ast - The top-level nodes of the template.
 * @param shadowingMembers - The members of the component named like a global identifier, which they shadow.
 * @returns A warning on each read, in the order of the template.
 */
export function getTemplateWarnings(ast: readonly ASTNode[], shadowingMembers: readonly string[]): TemplateWarning[] {
  const warnings = new Array<TemplateWarning>();
  const declared = new Set(shadowingMembers);

  walkTemplate(ast, [], {
    importNode: ({ specifiers }) => {
      for (let i = 0; i < specifiers.length; i++) {
        declared.add(specifiers[i].local);
      }
    },
    expression: (expression, variables) => {
      const reads = findGlobalReads(expression);
      for (let i = 0; i < reads.length; i++) {
        const { text } = reads[i];
        if (!declared.has(text) && !variables.has(text)) {
          warnings.push({
            span: getTemplateSpan(reads[i])!,
            message: `'${text}' exists only in the browser: on the server it is undefined. Read it in a @client block, or check it with typeof.`
          });
        }
      }
    }
  }, true);
  return warnings;
}

/**
 * Finds the reads of the globals only the browser has in an expression. A name the expression checks with `typeof`
 * guards its reads: it is read only when it exists. The type of a cast (`select(target as HTMLInputElement)`) reads
 * nothing.
 *
 * @param expression - The expression.
 * @returns The identifiers read.
 */
function findGlobalReads(expression: Expression): Identifier[] {
  const reads = new Array<Identifier>();
  const guarded = new Set<string>();
  collectGlobalReads(expression, expression, reads, guarded);
  return reads.filter(({ text }) => !guarded.has(text));
}

/**
 * Collects the reads of the globals only the browser has in a node of an expression, and in the nodes it holds, and the
 * names checked with `typeof` (see `findGlobalReads`).
 *
 * @param node - The node.
 * @param parent - The parent of the node, the node itself for the expression.
 * @param reads - The identifiers read, filled.
 * @param guarded - The names checked with `typeof`, filled.
 */
function collectGlobalReads(node: Node, parent: Node, reads: Identifier[], guarded: Set<string>): void {
  if (isTypeOfExpression(node) && isIdentifier(node.expression)) {
    guarded.add(node.expression.text);
  } else if (!isIdentifier(node)) {
    forEachExpressionChild(node, child => collectGlobalReads(child, node, reads, guarded));
  } else if (isBrowserOnlyGlobal(node.text) && !isMemberName(node, parent)) {
    reads.push(node);
  }
}

/**
 * Tells whether an identifier names a member instead of reading a variable: `name` in `user.name` and in `{ name: 1 }`.
 *
 * @param node - The identifier.
 * @param parent - The parent of the identifier.
 * @returns `true` when it names a member.
 */
function isMemberName(node: Identifier, parent: Node): boolean {
  return (isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node;
}
