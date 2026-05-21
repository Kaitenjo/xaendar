import { NoArgsFunction } from "@xaendar/types";
import { ParserCursor } from "../models/parser-cursor.model";
import { ASTNode } from "./ast.type";
import { Token } from "../../lexer/types/token.type";

/**
 * Defines the type for parser transition functions, which are responsible for consuming tokens and producing AST nodes based on the current parser state.
 *
 * Each function takes the current parser cursor, a parsing function for recursive
 * node parsing, and the token that triggered the transition. It returns an AST
 * node representing the parsed structure corresponding to that token.
 * 
 * @param cursor The parser cursor, used to navigate through the token stream.
 * @param parseNode A function that can be called to parse child nodes recursively.
 * @param token The current token that triggered this transition function.
 * @returns An AST node representing the parsed structure for the given token.
 */
export type ParserTransitionFunction<T extends Token = Token> = (cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, token: T) => ASTNode;