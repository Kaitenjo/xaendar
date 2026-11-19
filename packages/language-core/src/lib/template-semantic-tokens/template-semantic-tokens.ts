import { forEachExpressionChild, getTemplateSpan, type Span, walkTemplate } from '@xaendar/compiler';
import { isIdentifier, isPropertyAccessExpression, isPropertyAssignment, type Node } from 'typescript';
import type { TemplateAnalysis } from '../types/template-analysis.type';
import type { TemplateSemanticTokenType } from '../types/template-semantic-token-type.type';
import type { TemplateSemanticTokenModifier } from '../types/template-semantic-token-modifier.type';
import type { TemplateSemanticToken } from '../types/template-semantic-token.type';

/**
 * The types of the semantic tokens of a template, in the order of the legend.
 */
export const TEMPLATE_SEMANTIC_TOKEN_TYPES = ['property', 'event', 'decorator', 'variable', 'function'] as const;

/**
 * The modifiers of the semantic tokens of a template, in the order of the legend.
 */
export const TEMPLATE_SEMANTIC_TOKEN_MODIFIERS = ['readonly'] as const;

/**
 * Collects the semantic tokens of a template, sorted by position:
 * - an attribute bound to an input of a component or directive: `property`;
 * - an event bound to an output of a component or directive: `event`;
 * - the selector of a directive or structural directive: `decorator`;
 * - the element refs (`#name`), the variables of a `@for` block, the parameters of a template, the `@let`, the error of a
 *   `@catch` and `$event`, where declared and where read, the head of a handler called on a variable included: `variable`, `readonly`;
 * - the name of a template, where declared (`<template name(…)>`) and where rendered (`@render name(…)`): `function`.
 *
 * The tag names, of components too, and the native attributes and events are left to the grammar.
 *
 * @param analysis - The analysis of the template.
 * @returns The semantic tokens.
 */
export function getTemplateSemanticTokens({ ast, metadatas }: TemplateAnalysis): TemplateSemanticToken[] {
  const tokens = new Array<TemplateSemanticToken>();
  walkTemplate(ast, metadatas, {
    attribute: (node, owner) => {
      if (owner?.properties.has(node.name)) {
        addToken(tokens, node.nameSpan, 'property');
      }
    },
    event: (node, owner, variables) => {
      // The listener of a two-way binding is written by its input, which colors its name and its signal
      if (node.twoWay) {
        return;
      }

      if (owner?.events.has(node.name)) {
        addToken(tokens, node.nameSpan, 'event');
      }

      // A handler called on a variable of the template, e.g. `dialog.showModal()`
      const head = node.handler.split(/\?\.|[.[]/)[0];
      if (variables.has(head)) {
        addToken(tokens, { start: node.handlerSpan.start, end: node.handlerSpan.start + head.length }, 'variable', ['readonly']);
      }
    },
    ref: node => addToken(tokens, node.nameSpan, 'variable', ['readonly']),
    directive: node => addToken(tokens, node.selectorSpan, 'decorator'),
    forBlock: node => {
      addToken(tokens, node.itemAliasSpan, 'variable', ['readonly']);
      for (const span of node.implicitAliasSpans.values()) {
        addToken(tokens, span, 'variable', ['readonly']);
      }
    },
    template: ({ declaration, parameters }) => {
      addToken(tokens, declaration.nameSpan, 'function');
      for (let i = 0; i < parameters.length; i++) {
        addToken(tokens, parameters[i].nameSpan, 'variable', ['readonly']);
      }
    },
    tryBlock: node => addToken(tokens, node.catch.nameSpan, 'variable', ['readonly']),
    defer: node => addToken(tokens, node.error?.nameSpan, 'variable', ['readonly']),
    // The name a @render calls: an expression it calls is visited as one
    render: node => isIdentifier(node.calleeExpression) && addToken(tokens, node.calleeSpan, 'function'),
    let: node => addToken(tokens, node.nameSpan, 'variable', ['readonly']),
    expression: (expression, variables) => collectVariableReads(expression, expression, variables, span => addToken(tokens, span, 'variable', ['readonly']))
  });

  return tokens.sort((first, second) => first.span.start - second.span.start);
}

/**
 * Collects the identifiers of an expression reading a variable declared by the template: the types of the casts
 * (`format(value as Date)`) read none.
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

  forEachExpressionChild(node, child => collectVariableReads(child, node, variables, collect));
}

/**
 * Adds a semantic token, when the part of the template it colors is written.
 *
 * @param tokens - The semantic tokens, filled.
 * @param span - The span of the part, `undefined` when it is not written.
 * @param type - The type of the token.
 * @param modifiers - The modifiers of the token.
 */
function addToken(tokens: TemplateSemanticToken[], span: Span | undefined, type: TemplateSemanticTokenType, modifiers: TemplateSemanticTokenModifier[] = []): void {
  if (span) {
    tokens.push({ span, type, modifiers });
  }
}
