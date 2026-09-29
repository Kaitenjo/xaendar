import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { TagOpenNameToken } from '../../../lexer/types/tokens/tag-open-name-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { AttributeNode } from '../../types/nodes/attribute-node.type';
import { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import { ElementNode } from '../../types/nodes/element-node.type';
import { EventNode } from '../../types/nodes/event-node.type';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseConditionalBinding } from '../parse-conditional-binding/parse-conditional-binding.state';
import { parseEvent } from '../parse-event/parse-event.state';

/**
 * Parses a TAG_OPEN_NAME token and the subsequent attributes, events, and children
 * into an `ElementNode`. Handles both regular and self-closing tags.
 *
 * @param cursor - Parser cursor positioned at the TAG_OPEN_NAME token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The TAG_OPEN_NAME token containing the tag name.
 * @returns The parsed `ElementNode`.
 */
export function parseElement(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: TagOpenNameToken): MaybeASTNodeWithSpan<ElementNode> {
  cursor.advance();
  const tagName = token.parts[0];

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
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
      
      case TokenType.CONDITIONAL_BINDING:
        conditionalBindings.push(parseConditionalBinding(cursor, parseNode, token));
        break;

      default:
        read = false;
    }
  }

  assertUniqueAttributes(tagName, attributes, conditionalBindings);

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
        conditionalBindings
      };
    
    default:
      throw new Error(`Unexpected token ${peekedTokenType}`);
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
    conditionalBindings
  };
}

/**
 * Ensures every attribute/property is bound at most once on an element,
 * across the element itself and all of its (nested) conditional bindings.
 *
 * A conditional binding cannot share an attribute with the element or with
 * another conditional binding: when its condition turns false the runtime
 * unbinds the attribute (removing it or restoring the property's default),
 * which would clobber the value set by the other binding.
 * Events are not checked, since an element may listen to the same event more than once.
 *
 * @param tagName - Tag name of the element, used in the error message.
 * @param attributes - Attribute nodes to check.
 * @param conditionalBindings - Conditional bindings whose attributes are checked recursively.
 * @param bound - Attribute names already bound on the element.
 * @throws If an attribute is bound more than once.
 */
function assertUniqueAttributes(tagName: string, attributes: AttributeNode[], conditionalBindings: ConditionalBindingNode[], bound = new Set<string>()): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (bound.has(name)) {
      throw new Error(`Attribute "${name}" is bound more than once on <${tagName}>`, { cause: span });
    }

    bound.add(name);
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { attributes, conditionalBindings: nestedConditionalBindings } = conditionalBindings[i];
    assertUniqueAttributes(tagName, attributes, nestedConditionalBindings, bound);
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
