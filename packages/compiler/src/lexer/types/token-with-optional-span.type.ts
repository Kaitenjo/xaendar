import type { AttributeToken } from './tokens/attribute-token.type';
import type { AttributeValueToken } from './tokens/attribute-value-token.type';
import type { BlockCloseToken } from './tokens/block-close-token.type';
import type { BlockOpenToken } from './tokens/block-open-token.type';
import type { CaseToken } from './tokens/case-token.type';
import type { ConditionToken } from './tokens/condition-token.type';
import type { DefaultToken } from './tokens/default-token.type';
import type { DirectiveCloseToken } from './tokens/directive-close-token.type';
import type { DirectiveToken } from './tokens/directive-token.type';
import type { ElseIfToken } from './tokens/else-if-token.type';
import type { ElseToken } from './tokens/else-token.type';
import type { EventHandlerToken } from './tokens/event-handler-token.type';
import type { EventParAmeterToken } from './tokens/event-parameter-token.type';
import type { EventToken } from './tokens/event-token.type';
import type { ForToken } from './tokens/for-token.type';
import type { IfToken } from './tokens/if-token.type';
import type { ImportPathToken } from './tokens/import-path-token.type';
import type { ImportToken } from './tokens/import-token.type';
import type { InterpolationExpressionToken } from './tokens/interpolation-expression-token.type';
import type { LetDeclarationToken } from './tokens/let-declaration-token.type';
import type { LetToken } from './tokens/let-token.type';
import type { RenderCallToken } from './tokens/render-call-token.type';
import type { RenderToken } from './tokens/render-token.type';
import type { StructuralDirectiveToken } from './tokens/structural-directive-token.type';
import type { SwitchToken } from './tokens/switch-token.type';
import type { TagCloseNameToken } from './tokens/tag-close-name-token.type';
import type { TagCloseToken } from './tokens/tag-close-token.type';
import type { TagOpenNameToken } from './tokens/tag-open-name-token.type';
import type { TagSelfCloseToken } from './tokens/tag-self-close-token.type';
import type { TemplateDeclarationToken } from './tokens/template-declaration-token.type';
import type { ElementRefToken } from './tokens/element-ref-token.type';
import type { TextToken } from './tokens/text-token.type';
import type { MaybeTokenWithSpan } from './maybe-token-with-span.type';

/**
 * Union of the token types the lexer can emit, each one with its span still optional: the lexer gives a span to the tokens
 * missing it before returning them.
 */
export type TokenWithOptionalSpan = 
  | MaybeTokenWithSpan<TagOpenNameToken>
  | MaybeTokenWithSpan<TagSelfCloseToken>
  | MaybeTokenWithSpan<TagCloseToken>
  | MaybeTokenWithSpan<TagCloseNameToken>
  | MaybeTokenWithSpan<AttributeToken>
  | MaybeTokenWithSpan<AttributeValueToken>
  | MaybeTokenWithSpan<EventToken>
  | MaybeTokenWithSpan<EventHandlerToken>
  | MaybeTokenWithSpan<EventParAmeterToken>
  | MaybeTokenWithSpan<TextToken>
  | MaybeTokenWithSpan<InterpolationExpressionToken>
  | MaybeTokenWithSpan<IfToken>
  | MaybeTokenWithSpan<ElseIfToken>
  | MaybeTokenWithSpan<ElseToken>
  | MaybeTokenWithSpan<ForToken>
  | MaybeTokenWithSpan<SwitchToken>
  | MaybeTokenWithSpan<CaseToken>
  | MaybeTokenWithSpan<DefaultToken>
  | MaybeTokenWithSpan<ConditionToken>
  | MaybeTokenWithSpan<BlockOpenToken>
  | MaybeTokenWithSpan<BlockCloseToken>
  | MaybeTokenWithSpan<ImportToken>
  | MaybeTokenWithSpan<ImportPathToken>
  | MaybeTokenWithSpan<DirectiveToken>
  | MaybeTokenWithSpan<DirectiveCloseToken>
  | MaybeTokenWithSpan<StructuralDirectiveToken>
  | MaybeTokenWithSpan<ElementRefToken>
  | MaybeTokenWithSpan<TemplateDeclarationToken>
  | MaybeTokenWithSpan<RenderToken>
  | MaybeTokenWithSpan<RenderCallToken>
  | MaybeTokenWithSpan<LetToken>
  | MaybeTokenWithSpan<LetDeclarationToken>;
