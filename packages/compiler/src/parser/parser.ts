import { EOF } from "../costants/chars.constants";
import { TokenType } from "../lexer/models/token-type.enum";
import { AttributeToken, EventToken, InterpolationExpressionToken, InterpolationLiteralToken, TagOpenNameToken, TextToken, Token } from "../lexer/models/token.type";
import { ASTNode, AttributeNode, ElementNode, EventNode, InterpolationNode, TextNode } from "./models/ast.type";
import { ASTNodeType } from "./models/node.enum";
import { ParserCursor } from "./models/parser-cursor.model";

/**
 * Parser class that transforms a stream of tokens (from the Lexer)
 * into an Abstract Syntax Tree (AST) representing the template structure.
 *
 * Responsibilities:
 * - Parse text nodes, elements, attributes, events, and interpolations
 * - Maintain cursor state for sequential token consumption
 * - Detect tag boundaries and nested structures
 *
 * The parser assumes that the token stream is syntactically valid according
 * to the Lexer rules. Parsing errors are thrown as exceptions.
 */
export class Parser {

  /** Internal cursor for navigating tokens */
  private readonly _cursor: ParserCursor;

  /**
   * Creates a new Parser instance.
   *
   * @param tokens Array of tokens produced by the Lexer
   */
  constructor(private readonly tokens: Token[]) {
    this._cursor = new ParserCursor(this.tokens);
  }

  /**
   * Entry point for parsing the token stream into AST nodes.
   *
   * @returns Array of top-level AST nodes
   */
  public parse(): ASTNode[] {
    let eof = false;
    const nodes: ASTNode[] = [];

    while (!eof) {
      try {
        nodes.push(this.parseNode());
      } catch (err) {
        const error = err as Error;
        if (error.cause === EOF) {
          eof = true;
        } else {
          throw err;
        }
      }
    }

    return nodes;
  }

  /**
   * Parses the next AST node based on the current token.
   *
   * @returns Parsed AST node
   * @throws Error if an unexpected token is encountered
   */
  private parseNode(): ASTNode {
    const token = this._cursor.peek();

    switch (token.type) {
      case TokenType.TEXT:
        return this.parseText(token);

      case TokenType.INTERPOLATION_EXPRESSION:
      case TokenType.INTERPOLATION_LITERAL:
        return this.parseInterpolation(token);

      case TokenType.TAG_OPEN_NAME:
        return this.parseElement(token);

      default:
        throw this.error(`Unexpected token ${TokenType[token.type]}`);
    }
  }

  /**
   * Parses a text token into a TextNode.
   */
  private parseText(token: TextToken): TextNode {
    this._cursor.advance();
    return {
      type: ASTNodeType.Text,
      value: token.parts[0]
    };
  }

  /**
   * Parses an interpolation token into an InterpolationNode.
   */
  private parseInterpolation(token: InterpolationExpressionToken | InterpolationLiteralToken): InterpolationNode {
    this._cursor.advance();
    return {
      type: ASTNodeType.Interpolation,
      expression: token.parts[0]
    };
  }

  /**
   * Parses an element starting from a TAG_OPEN_NAME token.
   * Handles attributes, events, children, and tag closure.
   */
  private parseElement(token: TagOpenNameToken): ElementNode {
    this._cursor.advance();
    const tagName = token.parts[0];

    const attributes: AttributeNode[] = [];
    const events: EventNode[] = [];

    let read = true;
    while (read) {
      const token = this._cursor.peek();
      switch (token.type) {
        case TokenType.ATTRIBUTE:
          attributes.push(this.parseAttribute(token));
          break;

        case TokenType.EVENT:
          events.push(this.parseEvent(token));
          break;

        default:
          read = false;
      }
    }

    // Consume TAG_OPEN_END if present: <div>
    if (this._cursor.peek().type === TokenType.TAG_OPEN_END) {
      this._cursor.advance();
    }

    // Handle self-closing tags: <div />
    if (this._cursor.peek().type === TokenType.TAG_SELF_CLOSE) {
      this._cursor.advance();
      return {
        type: ASTNodeType.Element,
        tagName,
        attributes,
        events,
        children: []
      };
    }

    // Parse children recursively until closing tag
    const children: ASTNode[] = [];
    while (!this.isTagClose(tagName)) {
      children.push(this.parseNode());
    }

    // Consume closing tag </div>
    this._cursor.advance();

    return {
      type: ASTNodeType.Element,
      tagName,
      attributes,
      events,
      children
    };
  }

  /**
   * Parses an attribute token into an AttributeNode.
   * Supports literal values and interpolations as attribute values.
   */
  private parseAttribute(token: AttributeToken): AttributeNode {
    this._cursor.advance();
    const raw = token.parts[0];

    if (!raw.includes('=')) {
      return { name: raw, value: 'true' };
    }

    const [name, value] = raw.split('=');

    const nextToken = this._cursor.peek();
    if (nextToken.type === TokenType.INTERPOLATION_EXPRESSION || nextToken.type === TokenType.INTERPOLATION_LITERAL) {
      return {
        name: name!,
        value: this.parseInterpolation(nextToken)
      };
    }

    return {
      name: name!,
      value: value!.replace(/^["']|["']$/g, '')
    };
  }

  /**
   * Parses an event token into an EventNode.
   */
  private parseEvent(token: EventToken): EventNode {
    this._cursor.advance();
    const raw = token.parts[0];
    const [name, value] = raw.split('=');

    return {
      name: name!,
      handler: value!.replace(/^["']|["']$/g, '')
    };
  }

  /**
   * Checks whether the next token is a closing tag matching the given name.
   */
  private isTagClose(tagName: string): boolean {
    const nextToken = this._cursor.peek();
    return nextToken.type === TokenType.TAG_CLOSE_NAME && nextToken.parts[0] === tagName;
  }

  /**
   * Creates a parser error with a consistent prefix.
   */
  private error(message: string): Error {
    return new Error(`[Parser] ${message}`);
  }
}
