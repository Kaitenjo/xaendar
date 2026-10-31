import type { ImportNode, ElementNode, ComponentMetadata, ElementRefNode, AttributeNode, ComponentOrDirectiveMetadata, ClassBindingNode, EventNode, DirectiveNode, StructuralDirectiveNode, DirectiveMetadata, ForNode, TemplateNode, RenderNode, LetNode } from '@xaendar/compiler';
import type { Expression } from 'typescript';

/**
 * Callbacks invoked by {@link walkTemplate} for the parts of a template. Every callback is optional.
 */
export type TemplateVisitor = {
  /**
   * Invoked for every `@import` statement.
   */
  readonly importNode?: (node: ImportNode) => void;
  /**
   * Invoked for every element, with the metadata of the component it is, `undefined` for any other element.
   */
  readonly element?: (node: ElementNode, component: ComponentMetadata | undefined) => void;
  /**
   * Invoked for every element ref an element declares (`#name`).
   */
  readonly ref?: (node: ElementRefNode) => void;
  /**
   * Invoked for every attribute of an element or of a directive, conditional bindings included, with the metadata
   * of the component or directive it is bound to, `undefined` for the attributes of any other element.
   */
  readonly attribute?: (node: AttributeNode, owner: ComponentOrDirectiveMetadata | undefined) => void;
  /**
   * Invoked for every class toggled on an element (`[class.name]`), conditional bindings included.
   */
  readonly classBinding?: (node: ClassBindingNode) => void;
  /**
   * Invoked for every event bound on an element or on a directive, conditional bindings included, with the metadata
   * of the component or directive it is bound to, `undefined` for the events of any other element, and the names of
   * the variables declared by the template in its scope, which its handler can be called on.
   */
  readonly event?: (node: EventNode, owner: ComponentOrDirectiveMetadata | undefined, variables: ReadonlySet<string>) => void;
  /**
   * Invoked for every directive and structural directive, with its metadata, if imported.
   */
  readonly directive?: (node: DirectiveNode | StructuralDirectiveNode, directive: DirectiveMetadata | undefined) => void;
  /**
   * Invoked for every `@for` block.
   */
  readonly forBlock?: (node: ForNode) => void;
  /**
   * Invoked for every template declared (`<template name(…)>`).
   */
  readonly template?: (node: TemplateNode) => void;
  /**
   * Invoked for every `@render`.
   */
  readonly render?: (node: RenderNode) => void;
  /**
   * Invoked for every `@let`.
   */
  readonly let?: (node: LetNode) => void;
  /**
   * Invoked for every expression, with the names of the variables declared by the template in its scope: the template
   * variables, the templates and the `@let` of the enclosing scopes, the variables of the enclosing `@for` blocks, the parameters of
   * the enclosing template, and `$event` for the parameters of an event.
   */
  readonly expression?: (expression: Expression, variables: ReadonlySet<string>) => void;
};
