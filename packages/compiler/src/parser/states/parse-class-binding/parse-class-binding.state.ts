import { CSS_UNITS, toCssPropertyName } from '@xaendar/common';
import type { NoArgsFunction } from '@xaendar/types';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../types/nodes/class-binding-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { StyleBindingNode } from '../../types/nodes/style-binding-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';

/**
 * Matches the name of a class binding, capturing the name of the class: `[class.active]`.
 * A class name holds no whitespace, which `classList` rejects, nor brackets.
 */
const CLASS_BINDING_RE = /^\[class\.([^\s[\]]+)\]$/;

/**
 * Matches the name of a style binding, capturing what follows `style.`: `[style.color]`, `[style.width.px]`,
 * `[style.--accent]`.
 */
const STYLE_BINDING_RE = /^\[style\.([^\s[\]]+)\]$/;

/**
 * Matches the name of a style property and its unit, if any: `width` and `px` in `width.px`, `width` and `%` in
 * `width.%`, `backgroundColor` in `backgroundColor`.
 */
const STYLE_PROPERTY_RE = /^([a-zA-Z][a-zA-Z-]*)(?:\.([a-z]+|%))?$/;

/**
 * Tells whether an ATTRIBUTE token declares a binding in brackets, e.g. `[class.active]`, rather than an attribute.
 *
 * @param token - The ATTRIBUTE token.
 * @returns `true` if the name of the attribute starts with `[`.
 */
export function isBracketBinding(token: AttributeToken): boolean {
  return token.parts[0].startsWith('[');
}

/**
 * Parses an ATTRIBUTE token declaring a binding in brackets:
 * - `[class.name]="{expression}"` into a `ClassBindingNode`, toggling the class `name` on the element by the value of
 *   the expression;
 * - `[style.name]="{expression}"` into a `StyleBindingNode`, setting the style property `name`, written in kebab-case
 *   or in camelCase, a custom property (`--name`) included, followed by a unit, if any (`[style.width.px]`).
 *
 * @param cursor - Parser cursor; advanced past the binding and its value.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token, whose name starts with `[`.
 * @returns The parsed node.
 * @throws If the binding is neither `[class.name]` nor `[style.name]`, the property of a style binding is not valid or
 *   its unit is not one of CSS, or its value is not an interpolation.
 */
export function parseBracketBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): ClassBindingNode | StyleBindingNode {
  const { name, nameSpan, value, span } = parseAttribute(cursor, parseNode, token);
  const className = CLASS_BINDING_RE.exec(name)?.[1];
  const style = className ? undefined : STYLE_BINDING_RE.exec(name)?.[1];
  if (!className && !style) {
    throw new Error(`"${name}" is not a binding: a class is toggled with [class.name]="{expression}", a style property is set with [style.name]="{expression}"`, { cause: nameSpan });
  }

  if (typeof value === 'string') {
    throw new Error(`${name} ${className ? 'toggles the class' : 'sets the style property'} by the value of an expression: ${name}="{expression}"`, { cause: span });
  }

  if (className) {
    return { type: ASTNodeType.ClassBinding, className, nameSpan, value, span };
  }

  const node: StyleBindingNode = { type: ASTNodeType.StyleBinding, property: style!, nameSpan, value, span };
  // A custom property is set as it is written, without unit
  if (!style!.startsWith('--')) {
    const match = STYLE_PROPERTY_RE.exec(style!);
    if (!match) {
      throw new Error(`${name} does not name a style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. [style.width.px], or a custom property, e.g. [style.--accent]`, { cause: nameSpan });
    }

    const [, property, unit] = match;
    node.property = toCssPropertyName(property);
    if (unit) {
      if (!CSS_UNITS.has(unit)) {
        throw new Error(`${name} sets ${property} in "${unit}", which is not a unit of CSS: write one of them, e.g. px, rem, %, vh`, { cause: nameSpan });
      }

      node.unit = unit;
    }
  }

  return node;
}

/**
 * Ensures a directive declares no binding in brackets, in its parentheses or in the branches of its conditional
 * bindings: a directive only binds its own properties, while a class is toggled, and a style property set, on the
 * element.
 *
 * @param attributes - The attributes declared in the parentheses of the directive.
 * @param conditionalBindings - The conditional bindings of the directive, whose branches are checked recursively:
 *   none for a structural directive.
 * @throws If an attribute is a binding in brackets, or a branch declares a class or a style binding.
 */
export function assertNoBracketBindings(attributes: AttributeNode[], conditionalBindings?: ConditionalBindingNode[]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, nameSpan } = attributes[i];
    if (name.startsWith('[')) {
      throw new Error(`${name} cannot be bound inside a directive: bind it on the element`, { cause: nameSpan });
    }
  }

  if (conditionalBindings?.length) {
    assertNoBranchClassBindings(conditionalBindings);
  }
}

/**
 * Ensures the branches of the conditional bindings of a directive, nested ones included, declare no class nor style
 * binding. Their bindings in brackets are parsed as class or style bindings, so their attributes need no check.
 *
 * @param conditionalBindings - The conditional bindings.
 * @throws If a branch declares a class or a style binding.
 */
function assertNoBranchClassBindings(conditionalBindings: ConditionalBindingNode[]): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      const { classBindings, styleBindings } = branches[j];
      if (classBindings.length) {
        const { className, nameSpan } = classBindings[0];
        throw new Error(`[class.${className}] cannot be bound inside a directive: bind it on the element`, { cause: nameSpan });
      }

      if (styleBindings.length) {
        const { property, nameSpan } = styleBindings[0];
        throw new Error(`[style.${property}] cannot be bound inside a directive: bind it on the element`, { cause: nameSpan });
      }

      assertNoBranchClassBindings(branches[j].conditionalBindings);
    }
  }
}
