import type { RenderElementAttribute } from '@xaendar/core';

/**
 * An attribute, or a class, the code rendering on the server writes on an element: the descriptor of the client, never
 * unbound.
 */
export type ServerAttribute = Omit<RenderElementAttribute, 'unbind'>;
