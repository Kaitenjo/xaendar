import type { NoArgsFunction } from '@xaendar/types';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../types/nodes/class-binding-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';

/**
 * Matches the name of a class binding, capturing the name of the class: `[class.active]`.
 * A class name holds no whitespace, which `classList` rejects, nor brackets.
 */
const CLASS_BINDING_RE = /^\[class\.([^\s[\]]+)\]$/;

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
 * Parses an ATTRIBUTE token declaring a binding in brackets into a `ClassBindingNode`: `[class.name]="{expression}"`
 * toggles the class `name` on the element by the value of the expression.
 *
 * @param cursor - Parser cursor; advanced past the binding and its value.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token, whose name starts with `[`.
 * @returns The parsed `ClassBindingNode`.
 * @throws If the binding is not `[class.name]`, or its value is not an interpolation.
 */
export function parseClassBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): ClassBindingNode {
  const { name, nameSpan, value, span } = parseAttribute(cursor, parseNode, token);
  const className = CLASS_BINDING_RE.exec(name)?.[1];
  if (!className) {
    throw new Error(`"${name}" is not a binding: a class is toggled with [class.name]="{expression}"`, { cause: nameSpan });
  }

  if (typeof value === 'string') {
    throw new Error(`${name} toggles the class by the value of an expression: ${name}="{expression}"`, { cause: span });
  }

  return {
    type: ASTNodeType.ClassBinding,
    className,
    nameSpan,
    value,
    span
  };
}

/**
 * Ensures a directive declares no binding in brackets, in its parentheses or in the branches of its conditional
 * bindings: a directive only binds its own properties, while a class is toggled on the element.
 *
 * @param attributes - The attributes declared in the parentheses of the directive.
 * @param conditionalBindings - The conditional bindings of the directive, whose branches are checked recursively:
 *   none for a structural directive.
 * @throws If an attribute is a binding in brackets, or a branch declares a class binding.
 */
export function assertNoClassBindings(attributes: AttributeNode[], conditionalBindings?: ConditionalBindingNode[]): void {
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
 * Ensures the branches of the conditional bindings of a directive, nested ones included, declare no class binding.
 * Their bindings in brackets are parsed as class bindings, so their attributes need no check.
 *
 * @param conditionalBindings - The conditional bindings.
 * @throws If a branch declares a class binding.
 */
function assertNoBranchClassBindings(conditionalBindings: ConditionalBindingNode[]): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      const { classBindings } = branches[j];
      if (classBindings.length) {
        const { className, nameSpan } = classBindings[0];
        throw new Error(`[class.${className}] cannot be bound inside a directive: bind it on the element`, { cause: nameSpan });
      }

      assertNoBranchClassBindings(branches[j].conditionalBindings);
    }
  }
}
