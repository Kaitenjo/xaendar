import { ASTNodeType } from "./node.enum";

export type ASTNode =
  | ElementNode
  | TextNode
  | InterpolationNode;

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
