import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { NodeStrategy } from './node-strategy.type';

/**
 * Renders an instance of a template, as the compiler-generated render code does: it receives the element the instance
 * is rendered into, the context of the scope declaring the template, the node the instance is rendered before, the
 * values of the arguments, in the order of the parameters, and the strategy getting its nodes, the one of the place it is
 * rendered in, and returns the context it creates for the instance, which declares the parameters.
 */
export type RenderTemplate = Function<[parentNode: Element, declarationContext: _Context, referenceNode: Comment | null, params: readonly unknown[], nodeStrategy: NodeStrategy], _Context>;
