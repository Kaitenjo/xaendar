import type { Span } from '../../types/span.type';
import type { TokenType } from './token-type.enum';

/**
 * A token whose span is optional.
 *
 * @template T - The token.
 */
export type MaybeTokenWithSpan<T extends { type: TokenType, span: Span }> = Omit<T, 'span'> & Partial<Pick<T, 'span'>>;
