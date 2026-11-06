import type { ASTNode } from '../../../parser/types/ast.type';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';
import { typeCheckTriggers } from '../../utils/triggers/triggers.utils';

/**
 * Type-checks a `@defer` block: its triggers (see `typeCheckTriggers`), then its content, its `@placeholder` and its
 * `@loading`, each one a scope of its own, and its `@error` as the `catch` of a TypeScript `try`, so that the error is
 * typed as TypeScript types the binding of a `catch`, `unknown` with `strict`, its name mapped onto the template.
 *
 * @param node - The defer node.
 * @param processNode - Type-checks a node of a block.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckDefer(node: DeferNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = typeCheckTriggers(node, context);
  const { placeholder, loading, error } = node;

  const block = (children: readonly ASTNode[], blockContext = new TypeCheckContext(context)) => {
    const scope = typeCheckScope(children, blockContext, processNode);
    return indentLines(scope.declarations.concat(scope.lines));
  };

  lines.push(plain('{'), ...block(node.children), plain('}'));
  if (placeholder) {
    lines.push(plain('{'), ...block(placeholder.children), plain('}'));
  }

  if (loading) {
    lines.push(plain('{'), ...block(loading.children), plain('}'));
  }

  if (error) {
    const { name, nameSpan, children } = error;
    const errorContext = new TypeCheckContext(context);
    if (name) {
      errorContext.addUnresolvableIdentifier(name, 'value');
    }

    lines.push(
      plain('try { }'),
      name ? line('catch (', mapped(name, nameSpan!), ') {') : plain('catch {'),
      ...block(children, errorContext),
      plain('}')
    );
  }

  return lines;
}
