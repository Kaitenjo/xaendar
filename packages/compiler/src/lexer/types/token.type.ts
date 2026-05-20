import { TagOpenNameToken } from './tokens/tag-open-name-token.type.js';
import { TagSelfCloseToken } from './tokens/tag-self-close-token.type.js';
import { TagCloseToken } from './tokens/tag-close-token.type.js';
import { TagCloseNameToken } from './tokens/tag-close-name-token.type.js';
import { AttributeToken } from './tokens/attribute-token.type.js';
import { EventToken } from './tokens/event-token.type.js';
import { TextToken } from './tokens/text-token.type.js';
import { InterpolationExpressionToken } from './tokens/interpolation-expression-token.type.js';
import { InterpolationLiteralToken } from './tokens/interpolation-literal-token.type.js';
import { IfToken } from './tokens/if-token.type.js';
import { ForToken } from './tokens/for-token.type.js';
import { ElseToken } from './tokens/else-token.type.js';
import { SwitchToken } from './tokens/switch-token.type.js';
import { CaseToken } from './tokens/case-token.type.js';
import { DefaultToken } from './tokens/default-token.type.js';
import { ConditionToken } from './tokens/condition-token.type.js';
import { BlockOpenToken } from './tokens/block-open-token.type.js';
import { BlockCloseToken } from './tokens/block-close-token.type.js';
import { ConstDeclarationToken } from './tokens/const-declaration-token.type.js';
import { EOFToken } from './tokens/eof-token.type.js';
import { ElseIfToken } from './tokens/else-if-token.type.js';

/**
 * Union of all token types that the lexer can emit during tokenization.
 */
export type Token =
  | TagOpenNameToken
  | TagSelfCloseToken
  | TagCloseToken
  | TagCloseNameToken
  | AttributeToken
  | EventToken
  | TextToken
  | InterpolationExpressionToken
  | InterpolationLiteralToken
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
  | ConstDeclarationToken
  | EOFToken