import type { Span } from '../../types/span.type';
import type { ASTNodeType } from './node.enum';

/**
 * An AST node whose span is optional.
 *
 * @template T - The AST node.
 */
export type MaybeASTNodeWithSpan<T extends { type: ASTNodeType, span: Span }> = Omit<T, 'span'> & Partial<Pick<T, 'span'>>;
