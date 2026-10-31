import type { ASTNode, CompilerContext } from '@xaendar/compiler';
import type { Function } from '@xaendar/types';
import type { ServerParent } from './server-parent.type';
import type { ServerTransitionResult } from './server-transition-result.type';
import type { GenerateChildren } from './generate-children.type';

/**
 * Generates the code rendering a node on the server.
 *
 * @param node - The node.
 * @param parent - Where the node is rendered.
 * @param index - The position of the node among its siblings, which the names of its functions end with.
 * @param compilerContext - The compiler context of the node.
 * @param generateChildren - Generates the code of the children of an element, in the function being written.
 * @returns The code of the node, `undefined` for a node rendering nothing.
 */
export type ServerTransitionFunction<Node extends ASTNode = ASTNode> = Function<[node: Node, parent: ServerParent, index: string, compilerContext: CompilerContext, generateChildren: GenerateChildren], ServerTransitionResult | undefined>;
