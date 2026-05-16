import { EOF } from "../costants/chars.constants.js";
import { TokenType } from "../lexer/models/token-type.enum.js";
import { Token } from "../lexer/models/token.type.js";
import { ASTNode } from "./models/ast.type.js";
import { ParserContext } from "./models/parser-context.type.js";
import { ParserCursor } from "./models/parser-cursor.model.js";
import { parseText } from "./states/parse-text.state.js";
import { parseInterpolation } from "./states/parse-interpolation.state.js";
import { parseElement } from "./states/parse-element.state.js";
import { parseIfControlFlow } from "./states/parse-if.state.js";
import { parseForControlFlow } from "./states/parse-for.state.js";
import { parseSwitchControlFlow } from "./states/parse-switch.state.js";
import { parseConstDeclaration } from "./states/parse-const-declaration.state.js";

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

  /**
   * Internal cursor for navigating tokens
   */
  private readonly _cursor: ParserCursor;

  /**
   * Context passed to each parse state function
   */
  private readonly _context: ParserContext;

  /**
   * Creates a new Parser instance.
   *
   * @param tokens Array of tokens produced by the Lexer
   */
  constructor(private readonly tokens: Token[]) {
    this._cursor = new ParserCursor(this.tokens);
    this._context = { parseNode: () => this.parseNode() };
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
        return parseText(this._cursor, this._context, token);

      case TokenType.INTERPOLATION_EXPRESSION:
      case TokenType.INTERPOLATION_LITERAL:
        return parseInterpolation(this._cursor, this._context, token);

      case TokenType.TAG_OPEN_NAME:
        return parseElement(this._cursor, this._context, token);

      case TokenType.IF:
        return parseIfControlFlow(this._cursor, this._context, token);

      case TokenType.FOR:
        return parseForControlFlow(this._cursor, this._context, token);

      case TokenType.SWITCH:
        return parseSwitchControlFlow(this._cursor, this._context, token);

      case TokenType.CONST_DECLARATION:
        return parseConstDeclaration(this._cursor, this._context, token);

      default:
        throw new Error(`[Parser] Unexpected token ${TokenType[token.type]}`);
    }
  }
}
