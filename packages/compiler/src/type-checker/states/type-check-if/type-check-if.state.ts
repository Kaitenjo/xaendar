import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { Line } from '../../types/generated-line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, plain } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks an `@if`/`@else if`/`@else` chain using real TypeScript
 * `if` / `else if` / `else` blocks.
 *
 * This is a genuine correctness improvement over the previous
 * sibling-functions approach, not just a simplification: a real
 * `if`/`else if` chain gives the TS compiler's control-flow analysis the
 * negated narrowing of every preceding condition for free (e.g. inside an
 * `else if`, TS already knows the first condition was false) — something
 * flat sibling functions could never express.
 *
 * Each branch is a scope of its own, starting with the declarations of the element refs it declares.
 */
export function typeCheckIf(node: IfNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();
  lines.push(line('if (', mappedExpression(node.conditionNode, context, node.span), ') {'));
  lines.push(...indentLines(typeCheckBranch(node.children, processNode, context)));
  lines.push(plain('}'));

  let alt = node.alternate;
  while (alt?.type === ASTNodeType.ElseIf) {
    lines.push(line('else if (', mappedExpression(alt.conditionNode, context, alt.span), ') {'));
    lines.push(...indentLines(typeCheckBranch(alt.children, processNode, context)));
    lines.push(plain('}'));

    alt = alt.alternate;
  }

  if (alt) {
    lines.push(plain('else {'));
    lines.push(...indentLines(typeCheckBranch(alt.children, processNode, context)));
    lines.push(plain('}'));
  }

  return lines;
}

/**
 * Type-checks the content of a branch in a scope of its own: the declarations of the element refs it declares,
 * then its nodes.
 *
 * @param children - The nodes of the branch.
 * @param processNode - Callback emitting the lines of each node.
 * @param context - The scope enclosing the `@if`.
 * @returns The lines of the branch.
 */
function typeCheckBranch(children: ASTNode[], processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const { declarations, lines } = typeCheckScope(children, new TypeCheckContext(context), processNode);
  return declarations.concat(lines);
}