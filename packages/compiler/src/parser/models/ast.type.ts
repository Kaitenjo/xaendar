import { ASTNodeType } from './node.enum';

export type ASTNode =
  | ElementNode
  | TextNode
  | InterpolationNode
  | IfNode
  | ElseNode
  | ForNode
  | SwitchNode;

export type ElementNode = {
  type: ASTNodeType.Element
  tagName: string;
  attributes: AttributeNode[];
  events: EventNode[];
  children: ASTNode[];
}

export type AttributeNode = {
  name: string;
  value: string | InterpolationNode;
}

export type EventNode = {
  name: string;
  handler: string | InterpolationNode;
}

export type TextNode = {
  type: ASTNodeType.Text
  value: string;
}

export type InterpolationNode = {
  type: ASTNodeType.Interpolation
  expression: string;
}

export type IfNode = {
  type: ASTNodeType.If;
  condition: string;
  consequent: ASTNode[];
  alternate: ElseNode | null;
}

export type ElseNode = {
  type: ASTNodeType.Else;
  children: ASTNode[];
}

export type ForNode = {
  type: ASTNodeType.For;
  expression: string;
  children: ASTNode[];
}

export type SwitchNode = {
  type: ASTNodeType.Switch;
  expression: string;
  cases: CaseNode[];
}

export type CaseNode = {
  type: ASTNodeType.Case;
  condition: string | null; // null = @default
  children: ASTNode[];
}
