import type { Function, NoArgsFunction, VoidFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { TagOpenNameToken } from '../../../lexer/types/tokens/tag-open-name-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { AttributeNode } from '../../types/nodes/attribute-node.type';
import { ConditionalBindingBranchNode } from '../../types/nodes/conditional-binding-branch-node.type';
import { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import { DirectiveNode } from '../../types/nodes/directive-node.type';
import { ElementNode } from '../../types/nodes/element-node.type';
import { EventNode } from '../../types/nodes/event-node.type';
import { StructuralDirectiveNode } from '../../types/nodes/structural-directive-node.type';
import type { TemplateNode } from '../../types/nodes/template-node.type';
import type { ElementRefNode } from '../../types/nodes/element-ref-node.type';
import type { TemplateDeclarationNode } from '../../types/nodes/template-declaration-node.type';
import type { ClassBindingNode } from '../../types/nodes/class-binding-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { isBracketBinding, parseClassBinding } from '../parse-class-binding/parse-class-binding.state';
import { parseConditionalBinding } from '../parse-conditional-binding/parse-conditional-binding.state';
import { parseDirective } from '../parse-directive/parse-directive.state';
import { parseEvent } from '../parse-event/parse-event.state';
import { parseStructuralDirective } from '../parse-structural-directive/parse-structural-directive.state';
import { parseElementRef } from '../parse-element-ref/parse-element-ref.state';
import { parseTemplateDeclaration } from '../parse-template-declaration/parse-template-declaration.state';
import { isStructuralElement } from '../../utils/scope-declarations/scope-declarations.utils';
import { parseTemplateParameters } from '../../utils/template-parameters/template-parameters.utils';
import { parseTypeArguments } from '../../utils/type-arguments/type-arguments.utils';

/**
 * Parses a TAG_OPEN_NAME token and the subsequent element ref or declaration of a template, attributes, class bindings, events, conditional bindings, directives,
 * structural directives and children into an `ElementNode`. Handles both regular and self-closing tags.
 * A `<template>` is not an element but the declaration of a template, e.g. `<template row(item: Item)>`, parsed into a
 * `TemplateNode`.
 *
 * @param cursor - Parser cursor positioned at the TAG_OPEN_NAME token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The TAG_OPEN_NAME token containing the tag name, and the text of the type arguments if the element declares them.
 * @returns The parsed `ElementNode`, or `TemplateNode` for a `<template>`.
 * @throws If an attribute, a class or a directive is bound more than once, the element declares more than one element ref
 *   or one it may not render, a `<template>` declares anything but its name and its parameters, or the element is not
 *   closed correctly.
 */
export function parseElement(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: TagOpenNameToken): MaybeASTNodeWithSpan<ElementNode> | MaybeASTNodeWithSpan<TemplateNode> {
  cursor.advance();
  const tagName = token.parts[0];
  const nameSpan = cursor.findSpan(tagName, token.span.start);

  const attributes = new Array<AttributeNode>();
  const classBindings = new Array<ClassBindingNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
  const directives = new Array<DirectiveNode>();
  const structuralDirectives = new Array<StructuralDirectiveNode>();
  let ref: ElementRefNode | undefined;
  let declaration: TemplateDeclarationNode | undefined;
  // The text of the parameters of a template, declared by a `<template>` after its name
  let parameters: string | undefined;
  let read = true;

  while (read) {
    const token = cursor.peek();
    switch (token.type) {
      case TokenType.ELEMENT_REF: {
        const declared = parseElementRef(cursor, token);
        if (ref) {
          throw new Error(`<${tagName}> declares more than one element ref (#${ref.name}, #${declared.name}): an element has a single name`, { cause: declared.span });
        }

        ref = declared;
        break;
      }

      case TokenType.TEMPLATE_DECLARATION:
        declaration = parseTemplateDeclaration(cursor, token);
        parameters = token.parts[1];
        break;

      case TokenType.ATTRIBUTE:
        if (isBracketBinding(token)) {
          classBindings.push(parseClassBinding(cursor, parseNode, token));
        } else {
          attributes.push(parseAttribute(cursor, parseNode, token));
        }
        break;

      case TokenType.EVENT:
        events.push(parseEvent(cursor, parseNode, token));
        break;
      
      case TokenType.IF:
      case TokenType.SWITCH:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token));
        break;

      case TokenType.DIRECTIVE:
        directives.push(parseDirective(cursor, parseNode, token));
        break;

      case TokenType.STRUCTURAL_DIRECTIVE:
        structuralDirectives.push(parseStructuralDirective(cursor, parseNode, token));
        break;

      default:
        read = false;
    }
  }

  assertUniqueAttributes(attributes, conditionalBindings, name => `Attribute "${name}" is bound more than once on <${tagName}>`);
  assertUniqueClassBindings(classBindings, conditionalBindings, tagName);
  assertUniqueDirectives(tagName, directives, conditionalBindings, branch => branch.directives);
  assertUniqueDirectives(tagName, structuralDirectives, conditionalBindings, branch => branch.structuralDirectives);

  // The type arguments follow the tag name, after the `(` opening them
  const typeArguments = token.parts[1] === undefined ? undefined : parseTypeArguments(token.parts[1], nameSpan.end + 1);
  let node: MaybeASTNodeWithSpan<ElementNode> | MaybeASTNodeWithSpan<TemplateNode>;
  if (tagName === 'template') {
    const binding = typeArguments?.[0] ?? ref ?? attributes[0] ?? classBindings[0] ?? events[0] ?? conditionalBindings[0] ?? directives[0] ?? structuralDirectives[0];
    if (binding) {
      throw new Error('A <template> declares only its name and its parameters, e.g. <template row(item: Item)>: it renders nothing where it is declared, but where a @render calls it', { cause: binding.span });
    }

    node = toTemplateNode(nameSpan, declaration, parameters);
  } else {
    node = {
      type: ASTNodeType.Element,
      tagName,
      nameSpan,
      attributes,
      classBindings,
      events,
      children: [],
      conditionalBindings,
      directives,
      structuralDirectives
    };

    if (typeArguments) {
      node.typeArguments = typeArguments;
    }

    if (ref) {
      assertNameableElement(node, ref);
      node.ref = ref;
    }
  }

  const peekedTokenType = cursor.peek().type;
  switch (peekedTokenType) {
    // Consume TAG_OPEN_END if present: <div>
    case TokenType.TAG_OPEN_END:
      cursor.advance();
      break;

    // Handle self-closing tags: <div />
    case TokenType.TAG_SELF_CLOSE:
      cursor.advance();
      return node;

    default:
      throw new Error(`Unexpected token ${TokenType[peekedTokenType]}`);
  }

  // Parse children recursively until closing tag
  const { children } = node;
  while (!isTagClose(cursor, tagName)) {
    const child = parseNode();
    if (child) {
      children.push(child);
    }
  }

  // Consume closing tag </div>
  cursor.advance();
  node.closeNameSpan = cursor.findSpan(tagName, cursor.getCurrentToken().value.span.start);

  return node;
}

/**
 * Ensures every attribute/property is bound at most once at a time on an element or on a directive,
 * across the element (or the directive) itself and all of its (nested) conditional bindings.
 *
 * A conditional binding cannot share an attribute with its owner or with
 * another conditional binding: when its selected branch changes the runtime
 * unbinds the attribute (removing it or restoring the property's default),
 * which would clobber the value set by the other binding.
 * The branches of a conditional binding can instead bind the same attribute,
 * since only one of them is applied at a time.
 * Events are not checked, since an element may listen to the same event more than once.
 *
 * @param attributes - Attribute nodes to check.
 * @param conditionalBindings - Conditional bindings whose attributes are checked recursively.
 * @param describeDuplicate - Builds the error message for an attribute bound more than once.
 * @param bound - Attribute names already bound on the owner.
 * @throws If an attribute is bound more than once.
 */
function assertUniqueAttributes(attributes: AttributeNode[], conditionalBindings: ConditionalBindingNode[], describeDuplicate: Function<[name: string], string>, bound = new Set<string>()): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (bound.has(name)) {
      throw new Error(describeDuplicate(name), { cause: span });
    }

    bound.add(name);
  }

  assertUniqueInBranches(conditionalBindings, bound, (branch, boundInBranch) => assertUniqueAttributes(branch.attributes, branch.conditionalBindings, describeDuplicate, boundInBranch));
}

/**
 * Ensures every class is toggled at most once at a time on an element, across the element itself and all of its
 * (nested) conditional bindings, as {@link assertUniqueAttributes} does for the attributes: the branches of a
 * conditional binding can toggle the same class, since only one of them is applied at a time.
 *
 * @param classBindings - Class binding nodes to check.
 * @param conditionalBindings - Conditional bindings whose class bindings are checked recursively.
 * @param tagName - Tag name of the element, used in the error message.
 * @param bound - Names of the classes already toggled on the element.
 * @throws If a class is toggled more than once.
 */
function assertUniqueClassBindings(classBindings: ClassBindingNode[], conditionalBindings: ConditionalBindingNode[], tagName: string, bound = new Set<string>()): void {
  for (let i = 0; i < classBindings.length; i++) {
    const { className, span } = classBindings[i];
    if (bound.has(className)) {
      throw new Error(`Class "${className}" is bound more than once on <${tagName}>`, { cause: span });
    }

    bound.add(className);
  }

  assertUniqueInBranches(conditionalBindings, bound, (branch, boundInBranch) => assertUniqueClassBindings(branch.classBindings, branch.conditionalBindings, tagName, boundInBranch));
}

/**
 * Ensures every directive (or structural directive) is applied at most once at a time on an element, across the element
 * itself and all of its (nested) conditional bindings, and every directive property is
 * bound at most once at a time, across the directive itself and all of its (nested) conditional bindings.
 *
 * Directive properties don't clash with the element attributes, nor with the
 * properties of other directives, since each directive binds its own instance.
 * Directives and structural directives are checked separately, each kind through its own call.
 *
 * @param tagName - Tag name of the element, used in the error messages.
 * @param directives - Directive nodes to check.
 * @param conditionalBindings - Conditional bindings whose directives are checked recursively.
 * @param getDirectives - Returns the directives of the kind being checked applied by a branch of a conditional binding.
 * @param applied - Selectors of the directives already applied on the element.
 * @throws If a directive is applied more than once, or one of its properties is bound more than once.
 */
function assertUniqueDirectives(tagName: string, directives: (DirectiveNode | StructuralDirectiveNode)[], conditionalBindings: ConditionalBindingNode[], getDirectives: Function<[branch: ConditionalBindingBranchNode], (DirectiveNode | StructuralDirectiveNode)[]>, applied = new Set<string>()): void {
  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const { selector, attributes, span, type } = directive;
    const [kind, property] = type === ASTNodeType.Directive
      ? ['Directive', 'directive']
      : ['Structural directive', 'structural directive'];

    if (applied.has(selector)) {
      throw new Error(`${kind} "${selector}" is applied more than once on <${tagName}>`, { cause: span });
    }

    applied.add(selector);
    // A structural directive declares no conditional binding of its own
    assertUniqueAttributes(attributes, type === ASTNodeType.Directive ? directive.conditionalBindings : [], name => `Property "${name}" of ${property} "${selector}" is bound more than once on <${tagName}>`);
  }

  assertUniqueInBranches(conditionalBindings, applied, (branch, appliedInBranch) => assertUniqueDirectives(tagName, getDirectives(branch), branch.conditionalBindings, getDirectives, appliedInBranch));
}

/**
 * Runs a uniqueness check on every branch of a list of conditional bindings.
 *
 * The branches of a conditional binding are mutually exclusive, so they can declare the same names.
 * Each branch is therefore checked against its own copy of the names declared so far: only once all the
 * branches of a conditional binding have been checked the names they declare are added to the given ones,
 * so that the following conditional bindings cannot declare them again.
 *
 * @param conditionalBindings - The conditional bindings whose branches are checked.
 * @param declared - The names declared so far, updated with the ones declared by the branches.
 * @param assertUnique - Checks a branch against the given names, adding to them the ones the branch declares.
 */
function assertUniqueInBranches(conditionalBindings: ConditionalBindingNode[], declared: Set<string>, assertUnique: VoidFunction<[branch: ConditionalBindingBranchNode, declared: Set<string>]>): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    const declaredInBranches = new Set<string>();

    for (let j = 0; j < branches.length; j++) {
      const declaredInBranch = new Set(declared);
      assertUnique(branches[j], declaredInBranch);
      for (const name of declaredInBranch) {
        declaredInBranches.add(name);
      }
    }

    for (const name of declaredInBranches) {
      declared.add(name);
    }
  }
}

/**
 * Builds the node of the declaration of a template, `<template name(…)>`, without its children.
 *
 * @param nameSpan - Span of the tag name, `template`.
 * @param declaration - The name of the template, if the `<template>` declares one.
 * @param parameters - The text of the parameters the template declares after its name, if any.
 * @returns The node of the template.
 * @throws If the template has no name, or no parameters (`name()` declares none), or they are not valid.
 */
function toTemplateNode(nameSpan: TemplateNode['nameSpan'], declaration: TemplateDeclarationNode | undefined, parameters: string | undefined): MaybeASTNodeWithSpan<TemplateNode> {
  if (!declaration) {
    throw new Error('A <template> declares a template: name it and list its parameters, e.g. <template row(item: Item)>, then render it with @render row(item())', { cause: nameSpan });
  }

  if (parameters === undefined) {
    throw new Error(`A template lists its parameters in parentheses after its name, even when it has none: <template ${declaration.name}()>`, { cause: declaration.nameSpan });
  }

  return {
    type: ASTNodeType.Template,
    nameSpan,
    declaration,
    // The parameters follow the name, after the `(` opening them
    parameters: parseTemplateParameters(parameters, declaration.nameSpan.end + 1, declaration.name),
    children: []
  };
}

/**
 * Ensures an element can be named by an element ref: the ref names it in the whole of its scope, so the
 * element must exist as long as the scope does. A structural directive, applied directly or by a conditional binding,
 * may not render it.
 *
 * @param element - The element.
 * @param ref - The element ref the element declares.
 * @throws If a structural directive is applied to the element.
 */
function assertNameableElement(element: Pick<ElementNode, 'tagName' | 'structuralDirectives' | 'conditionalBindings'>, ref: ElementRefNode): void {
  const { tagName } = element;
  if (isStructuralElement(element)) {
    throw new Error(`<${tagName}> cannot declare #${ref.name}: its structural directives may not render it. Declare the ref on an element inside it, whose content is a scope of its own`, { cause: ref.span });
  }
}

/**
 * Returns `true` if the next token in the stream is a closing tag for the given tag name.
 *
 * @param cursor - Parser cursor to peek from.
 * @param tagName - The expected tag name to match.
 * @returns `true` if the next token is TAG_CLOSE_NAME matching `tagName`.
 */
function isTagClose(cursor: ParserCursor, tagName: string): boolean {
  const nextToken = cursor.peek();
  
  switch (nextToken.type) {
    case TokenType.EOF:
      throw new Error(`Expected closing tag ${tagName} while file is over`);
    
    case TokenType.TAG_CLOSE_NAME:
      const tokenTagName = nextToken.parts[0]; 
      if (tokenTagName === tagName) {
        return true;
      } else {
        throw `Expected closing tag ${tagName}, found ${tokenTagName}`;
      }
    
    default:
      return false;
  }
}
