import type { ASTNode, CompilerContext } from '@xaendar/compiler';
import type { Function } from '@xaendar/types';
import type { ServerParent } from './server-parent.type';
import type { ServerTransitionResult } from './server-transition-result.type';

/**
 * Generates the code of the children of an element rendered in the function being written, the ones of a plain element
 * and the light DOM of a component, which are not scopes of their own.
 *
 * @param nodes - The children.
 * @param parent - Where the children are rendered.
 * @param compilerContext - The compiler context of the children.
 * @returns The code of the children.
 */
export type GenerateChildren = Function<[nodes: readonly ASTNode[], parent: ServerParent, compilerContext: CompilerContext], ServerTransitionResult>;
