import { parseStyleDeclarations, splitClasses } from '@xaendar/common';
import type { Function } from '@xaendar/types';
import type { Expression } from 'typescript';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../../parser/types/nodes/class-binding-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import type { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { StyleBindingNode } from '../../../parser/types/nodes/style-binding-node.type';
import { toStringLiteral } from '../generator/generator.utils';
import { toArrayLiteral, toRoleName } from '../module-code/module-code.utils';

/**
 * The position of each directive among the ones its element applies, in the order they appear, its conditional
 * bindings included, for an element applying more than one (see `RenderElementDirective.order` of the runtime): filled
 * when the element is generated, read when its directives are, in the branches of its conditional bindings too.
 */
const directiveOrders = new WeakMap<DirectiveNode, number>();

/**
 * Gives each directive of an element applying more than one its position among them, in the order they appear, the
 * ones of the branches of its conditional bindings included: of two directives writing the same key of `class` or
 * `style`, the one appearing later wins. Both generators call it before mapping the directives of the element.
 *
 * @param node - The element.
 */
export function orderDirectives(node: ElementNode): void {
  const directives = node.directives.concat(collectBranchDirectives(node.conditionalBindings));
  if (directives.length > 1) {
    directives.sort((first, second) => first.span.start - second.span.start);
    for (let i = 0; i < directives.length; i++) {
      directiveOrders.set(directives[i], i);
    }
  }
}

/**
 * Gives the position of a directive among the ones of its element (see {@link orderDirectives}).
 *
 * @param directive - The directive.
 * @returns The position, `undefined` for the only directive of an element.
 */
export function getDirectiveOrder(directive: DirectiveNode): number | undefined {
  return directiveOrders.get(directive);
}

/**
 * Splits the attributes of an element, or of a branch of one of its conditional bindings, into its `class`, its `style`
 * and the other ones: `class` and `style` are written key by key, merged with the other sources writing them (see
 * `_RenderStyling` of the runtime), unless the component declares an input with their name.
 *
 * @param attributes - The attributes.
 * @param isInput - Tells whether a name is the one of an input of the element.
 * @returns The other attributes, then `class` and `style`, `undefined` when the element does not write them.
 */
export function splitStylingAttributes(attributes: readonly AttributeNode[], isInput: Function<[name: string], boolean>): [rest: AttributeNode[], classAttribute: AttributeNode | undefined, styleAttribute: AttributeNode | undefined] {
  const rest = new Array<AttributeNode>();
  let classAttribute: AttributeNode | undefined;
  let styleAttribute: AttributeNode | undefined;
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const { name } = attribute;
    if (name === 'class' && !isInput(name)) {
      classAttribute = attribute;
    } else if (name === 'style' && !isInput(name)) {
      styleAttribute = attribute;
    } else {
      rest.push(attribute);
    }
  }

  return [rest, classAttribute, styleAttribute];
}

/**
 * Writes the members of the descriptor of the `class` or of the `style` of an element (see `_RenderStyling` of the
 * runtime), without its setter: its string, static, parsed here (`text`, `statics`), or an expression (`string`), and
 * the keys it binds one by one (`keys`, `values`, `units`). The expressions are functions of the module, named after
 * the attribute (`div0$class`, `div0$class_active`, `div0$style_width`), which `declare` writes.
 *
 * @param attribute - The attribute.
 * @param string - The attribute holding the string, if any.
 * @param keys - The keys bound one by one: `[class.name]`, or `[style.name]`.
 * @param declare - Declares the function computing an expression, given the role it is named after, returning its name.
 * @returns The members, `undefined` when the element writes nothing on the attribute.
 */
export function describeStyling(attribute: 'class' | 'style', string: AttributeNode | undefined, keys: ReadonlyArray<ClassBindingNode | StyleBindingNode>, declare: Function<[role: string, expression: Expression], string>): string[] | undefined {
  const members = [`name: '${attribute}'`];
  if (string) {
    const { value } = string;
    if (typeof value !== 'string') {
      members.push(`string: ${declare(attribute, value.expression)}`);
    } else {
      const statics = attribute === 'class' ? toClassStatics(value) : toStyleStatics(value);
      if (statics) {
        members.push(`text: ${toStringLiteral(value)}`, `statics: ${statics}`);
      }
    }
  }

  if (keys.length) {
    const names = keys.map(key => key.type === ASTNodeType.ClassBinding ? key.className : key.property);
    members.push(`keys: ${toArrayLiteral(names.map(toStringLiteral))}`, `values: ${toArrayLiteral(keys.map((key, i) => declare(`${attribute}_${toRoleName(names[i])}`, key.value.expression)))}`);
    if (keys.some(key => key.type === ASTNodeType.StyleBinding && key.unit)) {
      members.push(`units: ${toArrayLiteral(keys.map(key => toStringLiteral((key as StyleBindingNode).unit ?? '')))}`);
    }
  }

  return members.length > 1 ? members : undefined;
}

/**
 * Writes the opinions of a static `class` string as the runtime reads them: each class, present.
 *
 * @param text - The string.
 * @returns The code of the array, `undefined` when the string holds no class.
 */
function toClassStatics(text: string): string | undefined {
  const classes = splitClasses(text);
  return classes && toArrayLiteral(classes.flatMap(name => [toStringLiteral(name), 'true']));
}

/**
 * Writes the opinions of a static `style` string as the runtime reads them: the names and the values of its
 * declarations, parsed as the runtime parses a string it computes.
 *
 * @param text - The string.
 * @returns The code of the array, `undefined` when the string holds no declaration.
 */
function toStyleStatics(text: string): string | undefined {
  const declarations = parseStyleDeclarations(text);
  return declarations && toArrayLiteral(declarations.map(toStringLiteral));
}

/**
 * Collects the directives the branches of conditional bindings apply, nested ones included.
 *
 * @param conditionalBindings - The conditional bindings.
 * @returns The directives.
 */
function collectBranchDirectives(conditionalBindings: readonly ConditionalBindingNode[]): DirectiveNode[] {
  let directives = new Array<DirectiveNode>();
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      directives = directives.concat(branches[j].directives, collectBranchDirectives(branches[j].conditionalBindings));
    }
  }

  return directives;
}
