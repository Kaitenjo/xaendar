import type { TryNode } from '../../../parser/types/nodes/try-node.type';
import { TypeCheckContext } from '../../models/context/context';
import type { Line } from '../../types/line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';
import { typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks a `@try` block and its `@catch` as a TypeScript `try`/`catch`, each one a scope of its own: the error is
 * typed as TypeScript types the binding of a `catch`, `unknown` with `strict`, and its name is mapped onto the template.
 *
 * @param node - The try node.
 * @param processNode - Type-checks a node of a block.
 * @param context - The scope the block is in.
 * @returns The generated type-check lines.
 */
export function typeCheckTry(node: TryNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const content = typeCheckScope(node.children, new TypeCheckContext(context), processNode);

  const { name, nameSpan, children } = node.catch;
  const catchContext = new TypeCheckContext(context);
  if (name) {
    catchContext.addUnresolvableIdentifier(name, 'value');
  }

  const fallback = typeCheckScope(children, catchContext, processNode);
  return [
    plain('try {'),
    ...indentLines(content.declarations.concat(content.lines)),
    name ? line('} catch (', mapped(name, nameSpan!), ') {') : plain('} catch {'),
    ...indentLines(fallback.declarations.concat(fallback.lines)),
    plain('}')
  ];
}
