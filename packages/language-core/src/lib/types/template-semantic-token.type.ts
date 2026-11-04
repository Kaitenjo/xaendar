import type { Span } from '@xaendar/compiler';
import type { TemplateSemanticTokenType } from './template-semantic-token-type.type';
import type { TemplateSemanticTokenModifier } from './template-semantic-token-modifier.type';

/**
 * A part of a template colored by what it is rather than by how it is written.
 */
export type TemplateSemanticToken = {
  /**
   * The span of the part.
   */
  readonly span: Span;
  /**
   * What the part is.
   */
  readonly type: TemplateSemanticTokenType;
  /**
   * The modifiers of the part.
   */
  readonly modifiers: readonly TemplateSemanticTokenModifier[];
};
