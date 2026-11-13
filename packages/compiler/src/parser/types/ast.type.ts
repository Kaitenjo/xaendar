import { CaseNode } from './nodes/case-node.type';
import { ElementNode } from './nodes/element-node.type';
import { ElseIfNode } from './nodes/else-if-node.type';
import { ElseNode } from './nodes/else-node.type';
import { ForNode } from './nodes/for-node.type';
import type { ClientNode } from './nodes/client-node.type';
import type { HydrateNode } from './nodes/hydrate-node.type';
import type { PlaceholderNode } from './nodes/placeholder-node.type';
import type { CatchNode } from './nodes/catch-node.type';
import type { EmptyNode } from './nodes/empty-node.type';
import type { TryNode } from './nodes/try-node.type';
import type { DeferNode } from './nodes/defer-node.type';
import type { LoadingNode } from './nodes/loading-node.type';
import type { ErrorNode } from './nodes/error-node.type';
import { IfNode } from './nodes/if-node.type';
import { ImportNode } from './nodes/import-node.type';
import { InterpolationNode } from './nodes/interpolation-node.type';
import type { LetNode } from './nodes/let-node.type';
import type { RenderNode } from './nodes/render-node.type';
import { SwitchNode } from './nodes/switch-node.type';
import type { TemplateNode } from './nodes/template-node.type';
import { TextNode } from './nodes/text-node.type';

/**
 * Union of all AST node types that the parser can produce from a token stream.
 */
export type ASTNode =
  | ElementNode
  | TextNode
  | InterpolationNode
  | IfNode
  | ElseIfNode
  | ElseNode
  | ForNode
  | SwitchNode
  | CaseNode
  | ImportNode
  | TemplateNode
  | RenderNode
  | LetNode
  | HydrateNode
  | ClientNode
  | PlaceholderNode
  | TryNode
  | CatchNode
  | EmptyNode
  | DeferNode
  | LoadingNode
  | ErrorNode;
 
