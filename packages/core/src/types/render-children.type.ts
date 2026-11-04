import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { NodeStrategy } from './node-strategy.type';

/**
 * Renders the children of an element, as the compiler-generated render code does: it receives the element, the context
 * owning it and the strategy getting the nodes of the children, and returns the context it creates for the children.
 */
export type RenderChildren = Function<[element: Element, parentContext: _Context, nodeStrategy: NodeStrategy], _Context>;
