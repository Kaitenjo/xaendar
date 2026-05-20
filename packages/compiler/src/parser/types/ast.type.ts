import { ConstDeclarationNode } from './nodes/const-declaration-node.type.js';
import { ElementNode } from './nodes/element-node.type.js';
import { ElseIfNode } from './nodes/else-if-node.type.js';
import { ElseNode } from './nodes/else-node.type.js';
import { ForNode } from './nodes/for-node.type.js';
import { IfNode } from './nodes/if-node.type.js';
import { InterpolationNode } from './nodes/interpolation-node.type.js';
import { SwitchNode } from './nodes/switch-node.type.js';
import { TextNode } from './nodes/text-node.type.js';

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
  | ConstDeclarationNode;
