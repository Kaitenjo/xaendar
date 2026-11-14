import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckExhaustiveDefault, typeCheckSwitchHeader } from '../../utils/exhaustive-switch/exhaustive-switch.utils';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks a `@switch` block using a real TypeScript `switch` statement.
 *
 * This drops the previous `const case_0: typeof switchExpr = 'literal';`
 * trick entirely: a real `switch (expr) { case 'literal': ... }` already
 * makes TS validate that each case value is assignable to the switch
 * expression's type as part of ordinary switch-statement semantics — and,
 * as a bonus, narrows the switch expression's type inside each case block
 * (e.g. from a `'loading' | 'error' | 'idle'` union down to just
 * `'loading'`), which the previous approach never provided.
 *
 * Multiple case labels that shared one body in the AST (fallthrough) are
 * emitted as stacked `case` labels sharing that same body, matching real
 * JS/TS fallthrough syntax directly.
 *
 * Each body is a scope of its own, starting with the declarations of the element refs it declares.
 *
 * A `@switch` ending with `@default never;` requires its cases to cover every value of the expression: its value is
 * kept in a constant the cases narrow, and the `default` requires what is left to be `never` (see
 * `typeCheckExhaustiveDefault`).
 *
 * @param node - The `@switch` to type-check.
 * @param processNode - Type-checks each node of the bodies.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 */
export function typeCheckSwitch(node: SwitchNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const { children, exhaustive, span } = node;
  const lines = typeCheckSwitchHeader(node.expression, span, !!exhaustive, context);
  for (let i = 0; i < children.length; i++) {
    const caseNode = children[i];
    const conditions = caseNode.condition;
    if (conditions?.length) {
      for (let j = 0; j < conditions.length; j++) {
        lines.push(line('  case ', mapped(conditions[j], caseNode.conditionSpans[j]), ':'));
      }
    } else {
      lines.push(plain('  default:'));
    }

    // Each case is a scope of its own: a block, when it declares element refs, so that the other cases can declare them too
    const { declarations, lines: content } = typeCheckScope(caseNode.children, new TypeCheckContext(context), processNode);
    const body = [...declarations, ...content, plain('break;')];
    lines.push(...indentLines(
      indentLines(declarations.length ? [plain('{'), ...indentLines(body), plain('}')] : body)
    ));
  }

  if (exhaustive) {
    lines.push(...indentLines(typeCheckExhaustiveDefault(span, exhaustive, context)));
  }

  lines.push(plain('}'));

  return lines;
}