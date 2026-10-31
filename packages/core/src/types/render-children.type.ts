import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';

/**
 * Renders the children of an element, as the compiler-generated render code does: it receives the element
 * and the context owning it, and returns the context it creates for the children.
 */
export type RenderChildren = Function<[element: Element, parentContext: _Context], _Context>;
