import type { TypeArgumentNode } from './type-argument-node.type';

/**
 * The type an interpolation or a parameter of an event handler is cast to, e.g. `string` in `{ value() as string }`:
 * like a type argument, only the type-check reads it, which writes it as is, and it generates no JavaScript.
 */
export type CastNode = Pick<TypeArgumentNode, 'text' | 'span'>;
