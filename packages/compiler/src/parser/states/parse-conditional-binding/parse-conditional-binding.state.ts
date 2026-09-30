import type { NoArgsFunction } from '@xaendar/types';
import type { Expression } from 'typescript';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { ElseIfToken } from '../../../lexer/types/tokens/else-if-token.type';
import type { ElseToken } from '../../../lexer/types/tokens/else-token.type';
import type { IfToken } from '../../../lexer/types/tokens/if-token.type';
import type { SwitchToken } from '../../../lexer/types/tokens/switch-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ConditionalBindingBranchNode } from '../../types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../types/nodes/directive-node.type';
import type { EventNode } from '../../types/nodes/event-node.type';
import type { IfBindingNode } from '../../types/nodes/if-binding-node.type';
import type { SwitchBindingNode } from '../../types/nodes/switch-binding-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseAttribute } from '../parse-attribute/parse-attribute.state';
import { parseDirective } from '../parse-directive/parse-directive.state';
import { parseEvent } from '../parse-event/parse-event.state';

/**
 * Parses a conditional binding, i.e. an IF or a SWITCH token declared among the bindings of an element or of
 * a directive together with all the branches it opens, into a `ConditionalBindingNode`.
 *
 * @param cursor - Parser cursor positioned at the IF or SWITCH token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The IF or SWITCH token opening the conditional binding.
 * @returns The parsed `ConditionalBindingNode`.
 * @throws If a condition is missing or is not a valid expression, a block is not opened, a `@switch` declares anything
 *   but `@case` and `@default` branches or a branch after the `@default` one, or an unexpected token is found in a branch.
 */
export function parseConditionalBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: IfToken | SwitchToken): ConditionalBindingNode {
  return token.type === TokenType.IF ? parseIfBinding(cursor, parseNode, token) : parseSwitchBinding(cursor, parseNode, token);
}

/**
 * Parses an `@if` chain: the IF token, every ELSE_IF token following the block of the previous branch and the
 * ELSE token closing the chain, if any, each one with its condition and the bindings declared in its block.
 *
 * @param cursor - Parser cursor positioned at the IF token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The IF token opening the chain.
 * @returns The parsed `IfBindingNode`.
 * @throws If the condition of an `@if` or `@else if` branch is missing or is not a valid expression.
 */
function parseIfBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: IfToken): IfBindingNode {
  const branches = new Array<ConditionalBindingBranchNode<Expression>>();
  let branchToken: IfToken | ElseIfToken | ElseToken = token;

  // The `@if` branch and the `@else if` ones following it all declare a condition
  do {
    // consume IF or ELSE_IF
    cursor.advance();
    const condition = validateExpression(parseCondition(cursor, branchToken.type)).node;
    branches.push(parseBranch(cursor, parseNode, branchToken.span.start, condition));
    branchToken = cursor.peek<ElseIfToken | ElseToken>();
  } while (branchToken.type === TokenType.ELSE_IF);

  if (branchToken.type === TokenType.ELSE) {
    // consume ELSE
    cursor.advance();
    branches.push(parseBranch(cursor, parseNode, branchToken.span.start, null));
  }

  return {
    type: ASTNodeType.IfBinding,
    branches,
    span: {
      start: token.span.start,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}

/**
 * Parses a `@switch`: the SWITCH token with its expression, and every CASE and DEFAULT token declared in
 * its block, each one with the bindings declared in its own block.
 *
 * @param cursor - Parser cursor positioned at the SWITCH token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param token - The SWITCH token.
 * @returns The parsed `SwitchBindingNode`.
 * @throws If the expression is missing or is not a valid expression, anything but a `@case` or a `@default` branch
 *   is declared in the block, or a branch is declared after the `@default` one.
 */
function parseSwitchBinding(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: SwitchToken): SwitchBindingNode {
  // consume SWITCH
  cursor.advance();
  const expression = validateExpression(parseCondition(cursor, token.type)).node;
  consumeBlockOpen(cursor);

  const branches = new Array<ConditionalBindingBranchNode<string[]>>();
  let read = true;

  while (read) {
    const branchToken = cursor.peek();
    switch (branchToken.type) {
      case TokenType.CASE:
      case TokenType.DEFAULT:
        /*
          The `@default` branch is selected whenever it is reached,
          so a branch declared after it would never be.
        */
        if (branches.at(-1)?.condition === null) {
          throw new Error('@default must be the last branch of a @switch');
        }

        branches.push(parseBranch(cursor, parseNode, branchToken.span.start, parseCases(cursor)));
        break;

      case TokenType.BLOCK_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error(`Unexpected ${TokenType[branchToken.type]} inside SWITCH, expected CASE or DEFAULT`);
    }
  }

  return {
    type: ASTNodeType.SwitchBinding,
    expression,
    branches,
    span: {
      start: token.span.start,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}

/**
 * Parses what selects a branch of a `@switch`, consuming the tokens declaring it: the conditions of
 * consecutive CASE tokens, which share the same block, or nothing for the DEFAULT token.
 *
 * @param cursor - Parser cursor positioned at the CASE or DEFAULT token opening the branch.
 * @returns The conditions of the `@case`s of the branch, or `null` for the `@default` branch.
 * @throws If a `@case` has no condition.
 */
function parseCases(cursor: ParserCursor): string[] | null {
  if (cursor.peek().type === TokenType.DEFAULT) {
    // consume DEFAULT
    cursor.advance();
    return null;
  }

  const conditions = new Array<string>();

  /*
    We loop to support a branch with multiple conditions, e.g.:
    @switch (x) {
      @case (1)
      @case (2) { ... }
    }
  */
  do {
    // consume CASE
    cursor.advance();
    conditions.push(parseCondition(cursor, TokenType.CASE));
  } while (cursor.peek().type === TokenType.CASE);

  return conditions;
}

/**
 * Parses the block of a branch, from its BLOCK_OPEN token up to its BLOCK_CLOSE one, collecting the attributes,
 * events, nested conditional bindings and directives declared in it into a `ConditionalBindingBranchNode`.
 *
 * @param cursor - Parser cursor positioned at the BLOCK_OPEN token of the branch.
 * @param parseNode - Parser function for recursive child parsing.
 * @param start - Offset of the keyword opening the branch, where its span starts.
 * @param condition - What selects the branch, or `null` for an `@else` or a `@default` branch.
 * @returns The parsed `ConditionalBindingBranchNode`.
 * @throws If the block is not opened, or an unexpected token is found in it.
 */
function parseBranch<Condition>(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, start: number, condition: Condition | null): ConditionalBindingBranchNode<Condition> {
  consumeBlockOpen(cursor);

  const attributes = new Array<AttributeNode>();
  const events = new Array<EventNode>();
  const conditionalBindings = new Array<ConditionalBindingNode>();
  const directives = new Array<DirectiveNode>();
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

      case TokenType.BLOCK_CLOSE:
        cursor.advance();
        read = false;
        break;

      default:
        throw new Error(`Unexpected ${TokenType[token.type]} in conditional binding`);
    }
  }

  return {
    type: ASTNodeType.ConditionalBindingBranch,
    condition,
    attributes,
    events,
    conditionalBindings,
    directives,
    span: {
      start,
      end: cursor.getCurrentToken().value.span.end,
    }
  };
}

/**
 * Consumes the CONDITION token following a flow-control keyword.
 *
 * @param cursor - Parser cursor positioned right after the keyword token.
 * @param keyword - The type of the keyword token, used in the error message.
 * @returns The raw condition declared between the parentheses of the keyword.
 * @throws If the keyword is not followed by a CONDITION token.
 */
function parseCondition(cursor: ParserCursor, keyword: TokenType): string {
  const token = cursor.peek();
  if (token.type !== TokenType.CONDITION) {
    throw new Error(`Expected CONDITION after ${TokenType[keyword]}, got ${TokenType[token.type]}`);
  }

  cursor.advance();
  return token.parts[0];
}

/**
 * Consumes the BLOCK_OPEN token opening the block of a branch or of a `@switch`.
 *
 * @param cursor - Parser cursor positioned at the BLOCK_OPEN token.
 * @throws If the next token is not a BLOCK_OPEN one.
 */
function consumeBlockOpen(cursor: ParserCursor): void {
  const token = cursor.peek();
  if (token.type !== TokenType.BLOCK_OPEN) {
    throw new Error(`Expected BLOCK_OPEN, got ${TokenType[token.type]}`);
  }

  cursor.advance();
}
