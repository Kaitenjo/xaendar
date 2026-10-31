import type { Function } from '@xaendar/types';
import type { Computed } from '../signals/types/computed.type';
import type { _Context } from '../utils/context/context.util';

/**
 * Renders an instance of a template, as the compiler-generated render code does: it receives the element the instance
 * is rendered into, the context of the scope declaring the template, the node the instance is rendered before and the
 * signals of the parameters, and returns the context it creates for the instance.
 */
export type RenderTemplate = Function<[parentNode: Element, declarationContext: _Context, referenceNode: Comment | null, params: Computed<unknown>[]], _Context>;
