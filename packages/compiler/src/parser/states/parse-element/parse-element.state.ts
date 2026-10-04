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
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseConditionalBinding } from '../parse-conditional-binding/parse-conditional-binding.state';
import { parseDirective } from '../parse-directive/parse-directive.state';
import { parseEvent } from '../parse-event/parse-event.state';
import { parseStructuralDirective } from '../parse-structural-directive/parse-structural-directive.state';

/**
 * Parses a TAG_OPEN_NAME token and the subsequent attributes, events, conditional bindings, directives, structural directives and children
 * into an `ElementNode`. Handles both regular and self-closing tags.
 *
 * @param cursor - Parser cursor positioned at the TAG_OPEN_NAME token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The TAG_OPEN_NAME token containing the tag name.
 * @returns The parsed `ElementNode`.
 * @throws If an attribute or a directive is bound more than once, or the element is not closed correctly.
 */
export function parseElement(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: TagOpenNameToken): MaybeASTNodeWithSpan<ElementNode> {
  cursor.advance();
  const tagName = token.parts[0];

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
  const directives = new Array<DirectiveNode>();
  const structuralDirectives = new Array<StructuralDirectiveNode>();
  let read = true;

  while (read) {
    const token = cursor.peek();
    switch (token.type) {
      case TokenType.ATTRIBUTE:
        attributes.push(parseAttribute(cursor, parseNode, token));
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
  assertUniqueDirectives(tagName, directives, conditionalBindings, branch => branch.directives);
  assertUniqueDirectives(tagName, structuralDirectives, conditionalBindings, branch => branch.structuralDirectives);

  const peekedTokenType = cursor.peek().type;
  switch (peekedTokenType) {
    // Consume TAG_OPEN_END if present: <div>
    case TokenType.TAG_OPEN_END: 
      cursor.advance();
      break;

    // Handle self-closing tags: <div />
    case TokenType.TAG_SELF_CLOSE:
      cursor.advance();
      return {
        type: ASTNodeType.Element,
        tagName,
        attributes,
        events,
        children: [],
        conditionalBindings,
        directives,
        structuralDirectives
      };
    
    default:
      throw new Error(`Unexpected token ${TokenType[peekedTokenType]}`);
  }

  // Parse children recursively until closing tag
  const children = new Array<ASTNode>;
  while (!isTagClose(cursor, tagName)) {
    const child = parseNode();
    if (child) {
      children.push(child);
    }
  }

  // Consume closing tag </div>
  cursor.advance();

  return {
    type: ASTNodeType.Element,
    tagName,
    attributes,
    events,
    children,
    conditionalBindings,
    directives,
    structuralDirectives
  };
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
      declaredInBranch.forEach(name => declaredInBranches.add(name));
    }

    declaredInBranches.forEach(name => declared.add(name));
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
