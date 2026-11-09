import type { AttributeNode } from '../parser/types/nodes/attribute-node.type';
import type { CaseNode } from '../parser/types/nodes/case-node.type';
import type { ClassBindingNode } from '../parser/types/nodes/class-binding-node.type';
import type { ClientNode } from '../parser/types/nodes/client-node.type';
import type { DeferNode } from '../parser/types/nodes/defer-node.type';
import type { DirectiveNode } from '../parser/types/nodes/directive-node.type';
import type { ElementNode } from '../parser/types/nodes/element-node.type';
import type { ElementRefNode } from '../parser/types/nodes/element-ref-node.type';
import type { EventNode } from '../parser/types/nodes/event-node.type';
import type { ForNode } from '../parser/types/nodes/for-node.type';
import type { HydrateNode } from '../parser/types/nodes/hydrate-node.type';
import type { ImportNode } from '../parser/types/nodes/import-node.type';
import type { LetNode } from '../parser/types/nodes/let-node.type';
import type { RenderNode } from '../parser/types/nodes/render-node.type';
import type { StructuralDirectiveNode } from '../parser/types/nodes/structural-directive-node.type';
import type { TemplateNode } from '../parser/types/nodes/template-node.type';
import type { TryNode } from '../parser/types/nodes/try-node.type';
import type { ComponentMetadata } from './component-metadata.type';
import type { ComponentOrDirectiveMetadata } from './component-or-directive-metadata.type';
import type { DirectiveMetadata } from './directive-metadata.type';
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
   * Invoked for every `@hydrate`.
   */
  readonly hydrate?: (node: HydrateNode) => void;
  /**
   * Invoked for every `@client`.
   */
  readonly client?: (node: ClientNode) => void;
  /**
   * Invoked for every `@try`, with its `@catch`.
   */
  readonly tryBlock?: (node: TryNode) => void;
  /**
   * Invoked for every `@defer`, with the blocks following it.
   */
  readonly defer?: (node: DeferNode) => void;
  /**
   * Invoked for every `@case` and `@default` of a `@switch`, whose conditions are texts written as is in the generated
   * code, not expressions.
   */
  readonly switchCase?: (node: CaseNode) => void;
  /**
   * Invoked for every expression, with the names of the variables declared by the template in its scope: the template
   * variables, the templates and the `@let` of the enclosing scopes, the variables of the enclosing `@for` blocks, the parameters of
   * the enclosing template, the error of the enclosing `@catch` and `@error` blocks, and `$event` for the parameters of an
   * event.
   */
  readonly expression?: (expression: Expression, variables: ReadonlySet<string>) => void;
};
