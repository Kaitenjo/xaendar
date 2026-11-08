import type { AttributeToken } from './tokens/attribute-token.type';
import type { AttributeValueToken } from './tokens/attribute-value-token.type';
import type { BlockCloseToken } from './tokens/block-close-token.type';
import type { BlockOpenToken } from './tokens/block-open-token.type';
import type { CaseToken } from './tokens/case-token.type';
import type { CastToken } from './tokens/cast-token.type';
import type { CatchToken } from './tokens/catch-token.type';
import type { ClientToken } from './tokens/client-token.type';
import type { ConditionToken } from './tokens/condition-token.type';
import type { DefaultToken } from './tokens/default-token.type';
import type { DeferToken } from './tokens/defer-token.type';
import type { DirectiveCloseToken } from './tokens/directive-close-token.type';
import type { DirectiveToken } from './tokens/directive-token.type';
import type { ElementRefToken } from './tokens/element-ref-token.type';
import type { ElseIfToken } from './tokens/else-if-token.type';
import type { ElseToken } from './tokens/else-token.type';
import type { EOFToken } from './tokens/eof-token.type';
import type { ErrorToken } from './tokens/error-token.type';
import type { EventHandlerToken } from './tokens/event-handler-token.type';
import type { EventParAmeterToken } from './tokens/event-parameter-token.type';
import type { EventToken } from './tokens/event-token.type';
import type { ForToken } from './tokens/for-token.type';
import type { HydrateToken } from './tokens/hydrate-token.type';
import type { IfToken } from './tokens/if-token.type';
import type { ImportPathToken } from './tokens/import-path-token.type';
import type { ImportToken } from './tokens/import-token.type';
import type { InterpolationExpressionToken } from './tokens/interpolation-expression-token.type';
import type { LetDeclarationToken } from './tokens/let-declaration-token.type';
import type { LetToken } from './tokens/let-token.type';
import type { LoadingToken } from './tokens/loading-token.type';
import type { PlaceholderToken } from './tokens/placeholder-token.type';
import type { RenderCallToken } from './tokens/render-call-token.type';
import type { RenderToken } from './tokens/render-token.type';
import type { StructuralDirectiveToken } from './tokens/structural-directive-token.type';
import type { SwitchToken } from './tokens/switch-token.type';
import type { TagCloseNameToken } from './tokens/tag-close-name-token.type';
import type { TagCloseToken } from './tokens/tag-close-token.type';
import type { TagOpenNameToken } from './tokens/tag-open-name-token.type';
import type { TagSelfCloseToken } from './tokens/tag-self-close-token.type';
import type { TemplateDeclarationToken } from './tokens/template-declaration-token.type';
import type { TextToken } from './tokens/text-token.type';
import type { TryToken } from './tokens/try-token.type';

/**
 * Union of all token types that the lexer can emit during tokenization.
 */
export type Token =
  | TagOpenNameToken
  | TagSelfCloseToken
  | TagCloseToken
  | TagCloseNameToken
  | AttributeToken
  | AttributeValueToken
  | EventToken
  | EventHandlerToken
  | EventParAmeterToken
  | TextToken
  | InterpolationExpressionToken
  | IfToken
  | ElseIfToken
  | ElseToken
  | ForToken
  | SwitchToken
  | CaseToken
  | DefaultToken
  | ConditionToken
  | BlockOpenToken
  | BlockCloseToken
  | ImportToken
  | ImportPathToken
  | DirectiveToken
  | DirectiveCloseToken
  | StructuralDirectiveToken
  | ElementRefToken
  | TemplateDeclarationToken
  | RenderToken
  | RenderCallToken
  | LetToken
  | LetDeclarationToken
  | HydrateToken
  | ClientToken
  | PlaceholderToken
  | TryToken
  | CatchToken
  | DeferToken
  | LoadingToken
  | ErrorToken
  | CastToken
  | EOFToken;
