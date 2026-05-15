import { EOF } from "../costants/chars.constants.js";
import { TokenType } from "../lexer/models/token-type.enum.js";
import { AttributeToken, ConditionToken, EventToken, ForToken, IfToken, InterpolationExpressionToken, InterpolationLiteralToken, TagOpenNameToken, TextToken, Token } from "../lexer/models/token.type.js";
import { ASTNode, AttributeNode, CaseNode, ElementNode, ElseNode, EventNode, ForNode, IfNode, InterpolationNode, SwitchNode, TextNode } from "./models/ast.type.js";
import { ASTNodeType } from "./models/node.enum.js";
import { ParserCursor } from "./models/parser-cursor.model.js";

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

      case TokenType.IF:
        return this.parseIfControlFlow(token);

      case TokenType.FOR:
        return this.parseForControlFlow(token);

      case TokenType.SWITCH:
        return this.parseSwitchControlFlow(token);

      default:
        throw this.error(`Unexpected token ${TokenType[token.type]}`);
    }
  }

  /**
   * Parses an @if block, including an optional @else branch.
   *
   * Expected token sequence:
   *   IF → CONDITION → BLOCK_OPEN → ...children... → BLOCK_CLOSE
   *   (optionally followed by: ELSE → BLOCK_OPEN → ...children... → BLOCK_CLOSE)
   */
  private parseIfControlFlow(_token: IfToken): IfNode {
    this._cursor.advance();

    const conditionToken = this._cursor.peek();
    if (conditionToken.type !== TokenType.CONDITION) {
      throw this.error(`Expected CONDITION after IF, got ${TokenType[conditionToken.type]}`);
    }

    const condition = conditionToken.parts[0];
    this._cursor.advance();
    this._cursor.advance();

    const consequent = this.parseBlockChildren();

    // Check for optional @else
    let alternate: ElseNode | null = null;
    const next = this._cursor.peek();

    if (next.type === TokenType.ELSE) {
      this._cursor.advance();
      this._cursor.advance();
      const elseChildren = this.parseBlockChildren();
      alternate = { type: ASTNodeType.Else, children: elseChildren };
    }

    return { type: ASTNodeType.If, condition, consequent, alternate };
  }

  /**
   * Parses a @for block.
   *
   * Expected token sequence:
   *   FOR → CONDITION → BLOCK_OPEN → ...children... → BLOCK_CLOSE
   */
  private parseForControlFlow(_token: ForToken): ForNode {
    this._cursor.advance(); // consume FOR

    const conditionToken = this._cursor.peek();
    if (conditionToken.type !== TokenType.CONDITION) {
      throw this.error(`Expected CONDITION after FOR, got ${TokenType[conditionToken.type]}`);
    }
    const expression = (conditionToken as ConditionToken).parts[0];
    this._cursor.advance(); // consume CONDITION

    this._cursor.advance(); // consume BLOCK_OPEN

    const children = this.parseBlockChildren();

    return { type: ASTNodeType.For, expression, children };
  }

  /**
   * Parses a @switch block containing @case and @default branches.
   *
   * Expected token sequence:
   *   SWITCH → CONDITION → BLOCK_OPEN
   *     (CASE → CONDITION → BLOCK_OPEN → ...children... → BLOCK_CLOSE)*
   *     (DEFAULT → BLOCK_OPEN → ...children... → BLOCK_CLOSE)?
   *   BLOCK_CLOSE
   */
  private parseSwitchControlFlow(_token: Token): SwitchNode {
    this._cursor.advance(); // consume SWITCH

    const conditionToken = this._cursor.peek();
    if (conditionToken.type !== TokenType.CONDITION) {
      throw this.error(`Expected CONDITION after SWITCH, got ${TokenType[conditionToken.type]}`);
    }
    const expression = (conditionToken as ConditionToken).parts[0];
    this._cursor.advance(); // consume CONDITION
    this._cursor.advance(); // consume BLOCK_OPEN

    const cases: CaseNode[] = [];

    while (this._cursor.peek().type !== TokenType.BLOCK_CLOSE) {
      const t = this._cursor.peek();

      if (t.type === TokenType.CASE) {
        this._cursor.advance(); // consume CASE
        const caseCondition = this._cursor.peek();
        if (caseCondition.type !== TokenType.CONDITION) {
          throw this.error(`Expected CONDITION after CASE`);
        }
        const caseExpr = (caseCondition as ConditionToken).parts[0];
        this._cursor.advance(); // consume CONDITION
        this._cursor.advance(); // consume BLOCK_OPEN
        cases.push({ type: ASTNodeType.Case, condition: caseExpr, children: this.parseBlockChildren() });
      } else if (t.type === TokenType.DEFAULT) {
        this._cursor.advance(); // consume DEFAULT
        this._cursor.advance(); // consume BLOCK_OPEN
        cases.push({ type: ASTNodeType.Case, condition: null, children: this.parseBlockChildren() });
      } else {
        break;
      }
    }

    this._cursor.advance(); // consume outer BLOCK_CLOSE

    return { type: ASTNodeType.Switch, expression, cases };
  }

  /**
   * Parses child nodes until a BLOCK_CLOSE token is encountered.
   * Consumes the BLOCK_CLOSE before returning.
   */
  private parseBlockChildren(): ASTNode[] {
    const children: ASTNode[] = [];

    while (this._cursor.peek().type !== TokenType.BLOCK_CLOSE) {
      children.push(this.parseNode());
    }

    this._cursor.advance(); // consume BLOCK_CLOSE
    return children;
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

    const attributes = new Array<AttributeNode>;
    const events = new Array<EventNode>;

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
    if (!name || !value) {
      throw this.error(`Invalid attribute format: ${raw}`);
    }

    const nextToken = this._cursor.peek();
    if (nextToken.type === TokenType.INTERPOLATION_EXPRESSION || nextToken.type === TokenType.INTERPOLATION_LITERAL) {
      return {
        name,
        value: this.parseInterpolation(nextToken)
      };
    }

    return {
      name,
      value: value.replace(/^['']|['']$/g, '')
    };
  }

  /**
   * Parses an event token into an EventNode.
   */
  private parseEvent(token: EventToken): EventNode {
    this._cursor.advance();
    const raw = token.parts[0];
    const [name, value] = raw.split('=');

    if (!name || !value) {
      throw this.error(`Invalid event format: ${raw}`);
    }

    return {
      name,
      handler: value.replace(/^[""]|[""]$/g, '')
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
