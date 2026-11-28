import { CSS_UNITS, toCssPropertyName } from '@xaendar/internals';
import type { NoArgsFunction } from '@xaendar/types';
import type { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../types/nodes/class-binding-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { PartBindingNode } from '../../types/nodes/part-binding-node.type';
import type { StyleBindingNode } from '../../types/nodes/style-binding-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';

/**
 * The prefix of a class binding, `class.active`.
 */
const CLASS_PREFIX = 'class.';

/**
 * The prefix of a style binding, `style.color`, `style.width.px`, `style.--accent`.
 */
const STYLE_PREFIX = 'style.';

/**
 * The prefix of a part binding, `part.selected`.
 */
const PART_PREFIX = 'part.';

/**
 * Matches the name of a part `exportparts` can forward: no whitespace, `,` nor `:`, nor brackets.
 */
const PART_NAME_RE = /^[^\s[\],:]+$/;

/**
 * Matches the name of a class: no whitespace, which `classList` rejects, nor brackets.
 */
const CLASS_NAME_RE = /^[^\s[\]]+$/;

/**
 * Matches the name of a style property and its unit, if any: `width` and `px` in `width.px`, `width` and `%` in
 * `width.%`, `backgroundColor` in `backgroundColor`.
 */
const STYLE_PROPERTY_RE = /^([a-zA-Z][a-zA-Z-]*)(?:\.([a-z]+|%))?$/;

/**
 * Tells whether the name of an attribute declares a class binding (`class.active`), a style binding (`style.color`) or
 * a part binding (`part.selected`).
 *
 * @param name - The name of the attribute.
 * @returns `true` if the name starts with `class.`, `style.` or `part.`.
 */
function isStylingName(name: string): boolean {
  return name.startsWith(CLASS_PREFIX) || name.startsWith(STYLE_PREFIX) || name.startsWith(PART_PREFIX);
}

/**
 * Tells whether an ATTRIBUTE token declares a class, a style or a part binding, e.g. `class.active`, rather than an
 * attribute.
 *
 * @param token - The ATTRIBUTE token.
 * @returns `true` if the name of the attribute starts with `class.`, `style.` or `part.`.
 */
export function isStylingBinding(token: AttributeToken): boolean {
  return isStylingName(token.parts[0]);
}

/**
 * Parses an ATTRIBUTE token declaring a class, a style or a part binding:
 * - `class.name="{expression}"` into a `ClassBindingNode`, toggling the class `name` on the element by the value of the
 *   expression;
 * - `style.name="{expression}"` into a `StyleBindingNode`, setting the style property `name`, written in kebab-case or
 *   in camelCase, a custom property (`--name`) included, followed by a unit, if any (`style.width.px`);
 * - `part.name="{expression}"` into a `PartBindingNode`, toggling the part `name` of the element by the value of the
 *   expression.
 *
 * @param cursor - Parser cursor; advanced past the binding and its value.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The ATTRIBUTE token, whose name starts with `class.`, `style.` or `part.`.
 * @returns The parsed node.
 * @throws If the binding names no class or no part, the property of a style binding is not valid or its unit is not one
 *   of CSS, or its value is not an interpolation.
 */
export function parseStylingBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: AttributeToken): ClassBindingNode | StyleBindingNode | PartBindingNode {
  const { name, nameSpan, value, span } = parseAttribute(cursor, parseNode, token);
  if (name.startsWith(PART_PREFIX)) {
    const partName = name.slice(PART_PREFIX.length);
    if (!PART_NAME_RE.test(partName)) {
      throw new Error(`${name} names no part: write part. followed by one name, without whitespace, comma nor colon, e.g. part.selected="{ expression }"`, { cause: nameSpan });
    }

    if (typeof value === 'string') {
      throw new Error(`${name} exposes the part by the value of an expression: ${name}="{expression}"`, { cause: span });
    }

    return { type: ASTNodeType.PartBinding, partName, nameSpan, value, span };
  }

  const isClass = name.startsWith(CLASS_PREFIX);
  const key = name.slice(isClass ? CLASS_PREFIX.length : STYLE_PREFIX.length);
  if (isClass && !CLASS_NAME_RE.test(key)) {
    throw new Error(`${name} names no class: write class. followed by the name of the class, e.g. class.active="{ expression }"`, { cause: nameSpan });
  }

  if (typeof value === 'string') {
    throw new Error(`${name} ${isClass ? 'toggles the class' : 'sets the style property'} by the value of an expression: ${name}="{expression}"`, { cause: span });
  }

  if (isClass) {
    return { type: ASTNodeType.ClassBinding, className: key, nameSpan, value, span };
  }

  const node: StyleBindingNode = { type: ASTNodeType.StyleBinding, property: key, nameSpan, value, span };
  // A custom property is set as it is written, without unit
  if (!key.startsWith('--') || key.length === 2) {
    const match = STYLE_PROPERTY_RE.exec(key);
    if (!match) {
      throw new Error(`${name} does not name a style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. style.width.px, or a custom property, e.g. style.--accent`, { cause: nameSpan });
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
 * Adds a class, a style or a part binding to the list of its kind.
 *
 * @param binding - The binding.
 * @param classBindings - The class bindings of the element or of the branch.
 * @param styleBindings - Its style bindings.
 * @param partBindings - Its part bindings.
 */
export function pushStylingBinding(binding: ClassBindingNode | StyleBindingNode | PartBindingNode, classBindings: ClassBindingNode[], styleBindings: StyleBindingNode[], partBindings: PartBindingNode[]): void {
  switch (binding.type) {
    case ASTNodeType.ClassBinding:
      classBindings.push(binding);
      break;

    case ASTNodeType.PartBinding:
      partBindings.push(binding);
      break;

    default:
      styleBindings.push(binding);
  }
}

/**
 * Ensures a directive declares no class, style or part binding nor attribute written with `attr.`, in its parentheses
 * or in the branches of its conditional bindings: a directive only binds its own properties, while a class or a part is
 * toggled, a style property set, and an attribute written, on the element.
 *
 * @param attributes - The attributes declared in the parentheses of the directive.
 * @param conditionalBindings - The conditional bindings of the directive, whose branches are checked recursively:
 *   none for a structural directive.
 * @throws If an attribute is a class, a style or a part binding or is written with `attr.`, or a branch declares one,
 *   or an attribute written with `attr.`.
 */
export function assertNoElementBindings(attributes: AttributeNode[], conditionalBindings?: ConditionalBindingNode[]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, nameSpan, attribute } = attributes[i];
    if (attribute !== undefined || isStylingName(name)) {
      throw new Error(`${name} cannot be bound inside a directive: bind it on the element`, { cause: nameSpan });
    }
  }

  if (conditionalBindings?.length) {
    assertNoBranchElementBindings(conditionalBindings);
  }
}

/**
 * Ensures the branches of the conditional bindings of a directive, nested ones included, declare no class, style or
 * part binding, nor attribute written with `attr.`. Their class, style and part bindings are parsed as such, so their
 * attributes need no check of the prefixes.
 *
 * @param conditionalBindings - The conditional bindings.
 * @throws If a branch declares a class, a style or a part binding, or an attribute written with `attr.`.
 */
function assertNoBranchElementBindings(conditionalBindings: ConditionalBindingNode[]): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      const { classBindings, styleBindings, partBindings, attributes } = branches[j];
      const written = attributes.find(({ attribute }) => attribute !== undefined) ?? classBindings[0] ?? styleBindings[0] ?? partBindings[0];
      if (written) {
        throw new Error(`${written.type === ASTNodeType.Attribute ? written.name : bindingName(written)} cannot be bound inside a directive: bind it on the element`, { cause: written.nameSpan });
      }

      assertNoBranchElementBindings(branches[j].conditionalBindings);
    }
  }
}

/**
 * Gives the name a class, a style or a part binding is written with, its unit aside: `class.on`, `style.color`,
 * `part.selected`.
 *
 * @param binding - The binding.
 * @returns The name.
 */
function bindingName(binding: ClassBindingNode | StyleBindingNode | PartBindingNode): string {
  switch (binding.type) {
    case ASTNodeType.ClassBinding:
      return `${CLASS_PREFIX}${binding.className}`;

    case ASTNodeType.PartBinding:
      return `${PART_PREFIX}${binding.partName}`;

    default:
      return `${STYLE_PREFIX}${binding.property}`;
  }
}
