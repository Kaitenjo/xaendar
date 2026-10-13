import { Expression } from 'typescript';
import type { Span } from '../../types/span.type';
import { ForImplicitVariables } from './nodes/for-implicit-variables';

/**
 * Represents the parsed result of an `@for` block expression.
 *
 * Contains the loop variable alias, the iterable and track expressions
 * (both as raw source strings and as validated TypeScript AST nodes),
 * any explicit implicit-variable aliases, and any diagnostics collected
 * during parsing.
 */
export type ForExpression = {
  /**
   * The loop variable alias (e.g. `item` in `@for(item of items)`), `undefined` when the
   * `item of` part is omitted (e.g. `@for(10; track $index)`).
   */
  itemAlias?: string;
  /**
   * Span of the loop variable alias, `undefined` when there is none.
   */
  itemAliasSpan?: Span;
  /**
   * The iterable expression parsed and validated as a JS expression (e.g. `items`):
   * an array, or a number `n` iterated as `0, 1, ..., n - 1`.
   */
  iterableExpression: Expression;
  /** 
   * The raw source string of the iterable (e.g. `"items"`). 
   */
  iterableSource: string;
  /** 
   * The track expression parsed and validated as a JS expression (e.g. `item.id`). 
   */
  trackExpression: Expression;
  /** 
   * The raw source string of the track expression (e.g. `"item.id"`). 
   */
  trackSource: string;
  /** 
   * Map of explicit implicit variable aliases (e.g. `{ i: '$index', l: '$last' }`). 
   */
  implicitAliases: Map<ForImplicitVariables, string>;
  /**
   * Spans of the explicit implicit variable aliases (e.g. `i` in `$index = i`), keyed by implicit variable.
   */
  implicitAliasSpans: Map<ForImplicitVariables, Span>;
}