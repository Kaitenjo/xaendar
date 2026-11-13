import { toModelChangeEvent } from '@xaendar/common';
import type { NoArgsFunction } from '@xaendar/types';
import { type Expression, isElementAccessExpression, isIdentifier, isPropertyAccessExpression } from 'typescript';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import type { Span } from '../../../types/span.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';
import type { TwoWayBinding } from '../../types/two-way-binding.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';

/**
 * Matches the name of a two-way binding, capturing the name of the model: `value` in `[(value)]`.
 */
const TWO_WAY_BINDING_RE = /^\[\(([^\s()[\]]+)\)\]$/;

/**
 * Tells whether an ATTRIBUTE token declares a two-way binding, e.g. `[(value)]`, rather than an attribute or a binding
 * in brackets.
 *
 * @param token - The ATTRIBUTE token.
 * @returns `true` if the name of the attribute starts with `[(`.
 */
export function isTwoWayBinding(token: AttributeToken): boolean {
  return token.parts[0].startsWith('[(');
}

/**
 * Parses an ATTRIBUTE token declaring a two-way binding, `[(value)]="signal"`, into the two bindings it stands for: the
 * input `value`, bound to the value of the signal (`value="{signal()}"`), and the listener of its event of change,
 * writing the detail into the signal (`(valueChange)="signal.set($event.detail)"`).
 *
 * The signal is named as Angular names the target of a two-way binding: a member, a variable of the template or a
 * property of theirs (`count`, `form.name`, `item.quantity`, `rows[0]`), without call. Both nodes are marked `twoWay`;
 * the name of the input is the span of both names, the signal the span of the handler.
 *
 * @param cursor - Parser cursor; advanced past the binding and its value.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token, whose name starts with `[(`.
 * @returns The attribute and the event.
 * @throws If the name is not `[(name)]`, the binding has no value, its value is an interpolation, or it does not name a
 *   signal.
 */
export function parseTwoWayBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): TwoWayBinding {
  const { name: bracketed, nameSpan: bracketedSpan, value, span, bare } = parseAttribute(cursor, parseNode, token);
  const name = TWO_WAY_BINDING_RE.exec(bracketed)?.[1];
  if (!name) {
    throw new Error(`"${bracketed}" is not a two-way binding: write [(name)]="signal"`, { cause: bracketedSpan });
  }

  if (bare || typeof value !== 'string' || !value.trim()) {
    throw new Error(`[(${name})] binds a writable signal, named without braces nor call: [(${name})]="signal"`, { cause: span });
  }

  const nameSpan = { start: bracketedSpan.start + 2, end: bracketedSpan.end - 2 };
  const target = value.trim();
  const targetSpan = cursor.findSpan(target, bracketedSpan.end);
  assertSignalReference(validateExpression(target, targetSpan.start).node, name, targetSpan);
  const attribute: AttributeNode = {
    type: ASTNodeType.Attribute,
    name,
    nameSpan,
    value: { type: ASTNodeType.Interpolation, expression: validateExpression(`${target}()`, targetSpan.start).node, span: targetSpan },
    span,
    twoWay: true
  };
  const event: EventNode = {
    type: ASTNodeType.Event,
    name: toModelChangeEvent(name),
    nameSpan,
    handler: `${target}.set`,
    handlerSpan: targetSpan,
    parameters: [validateExpression('$event.detail').node],
    span,
    twoWay: true
  };

  return { attribute, event };
}

/**
 * Ensures the value of a two-way binding names a signal: an identifier, or a chain of accesses to its properties, without
 * calls nor optional chaining, since the binding both reads it and writes it.
 *
 * @param expression - The value of the binding.
 * @param name - The name of the model, used in the error message.
 * @param span - The span of the value.
 * @throws If the value is anything else.
 */
function assertSignalReference(expression: Expression, name: string, span: Span): void {
  let node = expression;
  while ((isPropertyAccessExpression(node) || isElementAccessExpression(node)) && !node.questionDotToken) {
    node = node.expression;
  }

  if (!isIdentifier(node)) {
    throw new Error(`[(${name})] binds a writable signal, named without braces nor call: a member, a variable of the template or one of their properties, e.g. [(${name})]="count"`, { cause: span });
  }
}
