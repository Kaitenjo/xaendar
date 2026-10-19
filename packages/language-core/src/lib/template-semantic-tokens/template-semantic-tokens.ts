import { getTemplateSpan, type Span } from '@xaendar/compiler';
import { forEachChild, isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * The types of the semantic tokens of a template, in the order of the legend.
 */
export const TEMPLATE_SEMANTIC_TOKEN_TYPES = ['property', 'event', 'decorator', 'variable', 'function'] as const;

/**
 * The modifiers of the semantic tokens of a template, in the order of the legend.
 */
export const TEMPLATE_SEMANTIC_TOKEN_MODIFIERS = ['readonly'] as const;

/**
 * The type of a semantic token of a template.
 */
export type TemplateSemanticTokenType = typeof TEMPLATE_SEMANTIC_TOKEN_TYPES[number];

/**
 * A modifier of a semantic token of a template.
 */
export type TemplateSemanticTokenModifier = typeof TEMPLATE_SEMANTIC_TOKEN_MODIFIERS[number];

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

/**
 * Collects the semantic tokens of a template, sorted by position:
 * - an attribute bound to an input of a component or directive: `property`;
 * - an event bound to an output of a component or directive: `event`;
 * - the selector of a directive or structural directive: `decorator`;
 * - the element refs (`#name`), the variables of a `@for` block, the parameters of a template, the `@let` and
 *   `$event`, where declared and where read, the head of a handler called on a variable included: `variable`, `readonly`;
 * - the name of a template, where declared (`<template #name(…)>`) and where rendered (`@render name(…)`): `function`.
 *
 * The tag names, of components too, and the native attributes and events are left to the grammar.
 *
 * @param analysis - The analysis of the template.
 * @returns The semantic tokens.
 */
export function getTemplateSemanticTokens({ ast, metadatas }: TemplateAnalysis): TemplateSemanticToken[] {
  const tokens = new Array<TemplateSemanticToken>();
  const add = (span: Span | undefined, type: TemplateSemanticTokenType, modifiers: TemplateSemanticTokenModifier[] = []) => {
    if (span) {
      tokens.push({ span, type, modifiers });
    }
  };

  walkTemplate(ast, metadatas, {
    attribute: (node, owner) => {
      if (owner?.properties.has(node.name)) {
        add(node.nameSpan, 'property');
      }
    },
    event: (node, owner, variables) => {
      if (owner?.events.has(node.name)) {
        add(node.nameSpan, 'event');
      }

      // A handler called on a variable of the template, e.g. `dialog.showModal()`
      const head = node.handler.split(/\?\.|[.[]/)[0];
      if (variables.has(head)) {
        add({ start: node.handlerSpan.start, end: node.handlerSpan.start + head.length }, 'variable', ['readonly']);
      }
    },
    ref: node => add(node.nameSpan, 'variable', ['readonly']),
    directive: node => add(node.selectorSpan, 'decorator'),
    forBlock: node => {
      add(node.itemAliasSpan, 'variable', ['readonly']);
      for (const span of node.implicitAliasSpans.values()) {
        add(span, 'variable', ['readonly']);
      }
    },
    template: ({ ref, parameters }) => {
      add(ref.nameSpan, 'function');
      for (let i = 0; i < parameters.length; i++) {
        add(parameters[i].nameSpan, 'variable', ['readonly']);
      }
    },
    render: node => add(node.calleeSpan, 'function'),
    let: node => add(node.nameSpan, 'variable', ['readonly']),
    expression: (expression, variables) => collectVariableReads(expression, expression, variables, span => add(span, 'variable', ['readonly']))
  });

  return tokens.sort((first, second) => first.span.start - second.span.start);
}

/**
 * Collects the identifiers of an expression reading a variable declared by the template.
 *
 * @param node - The node of the expression to visit.
 * @param parent - The parent of the node.
 * @param variables - The variables declared by the template in the scope of the expression.
 * @param collect - Invoked with the span of every identifier reading a variable.
 */
function collectVariableReads(node: Node, parent: Node, variables: ReadonlySet<string>, collect: (span: Span | undefined) => void): void {
  // The name of a member (`obj.item`, `{ item: 1 }`) is not a variable
  const isMemberName = (isPropertyAccessExpression(parent) || isPropertyAssignment(parent)) && parent.name === node;
  if (isIdentifier(node) && !isMemberName && variables.has(node.text)) {
    collect(getTemplateSpan(node));
  }

  forEachChild(node, child => collectVariableReads(child, node, variables, collect));
}

