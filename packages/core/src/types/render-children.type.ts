import type { Function } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';

/**
 * Renders the children of an element, as the compiler-generated render code does: it receives the element and the context
 * the children are rendered in, whose strategy gets their nodes. Children declaring nothing are rendered in it, and the
 * function returns nothing; the ones declaring names (the content of an element a structural directive is applied to) or
 * creating their elements in another namespace (the children of `<svg>`, `<math>`, `<foreignObject>`) are rendered in a
 * context they create, which the function returns.
 */
export type RenderChildren = Function<[element: Element, context: _Context], _Context | undefined>;
