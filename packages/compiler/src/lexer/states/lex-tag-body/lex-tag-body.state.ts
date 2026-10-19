import { AT_SIGN, CR, GREATER_THEN, HASHTAG, LF, LPAREN, SLASH, SPACE, STAR, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { isConditionalBindingKeyword } from '../../utils/conditional-binding/conditional-binding.utils';
import { expectsTemplateDeclaration } from '../../utils/template-declaration/template-declaration.utils';

/**
 * Scans the body of an open tag to determine what comes next:
 * a conditional binding (`@if`, `@switch`), a directive (`@@`), a structural directive (`*`), an element ref (`#`),
 * an event binding (`(`), the declaration of a template on a `<template>` (`row(item: Item)`), an attribute, the end of the
 * tag (`>` or `/`), or whitespace.
 * Transitions to the appropriate state without emitting any tokens.
 *
 * @param cursor - The lexer cursor positioned inside a tag body.
 * @param context - The lexer context, whose tokens tell whether the tag is a `<template>` to declare.
 * @returns Transition result with the next state and no tokens.
 * @throws If a `@` starts neither a conditional binding nor a directive.
 */
export function lexTagBody(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case AT_SIGN:
        let state: LexerState;
        if (isConditionalBindingKeyword(cursor)) {
          // The keyword is consumed by the flow-control state.
          state = LexerState.FLOW_CONTROL;
        } else if (cursor.peekMatch('@@')) {
          state = LexerState.DIRECTIVE;
          // Consume `@@`.
          cursor.advance(2);
        } else {
          throw '\'@\' must start a conditional binding (@if, @else, @switch, @case, @default) or a directive (@@selector): events are bound with (eventName)="handler()"';
        }

        retVal = {
          state
        }
        read = false;
        break;

      case STAR:
        // Consume `*`.
        cursor.advance();
        retVal = {
          state: LexerState.STRUCTURAL_DIRECTIVE
        }
        read = false;
        break;

      case HASHTAG:
        // Consume `#`.
        cursor.advance();
        retVal = {
          state: LexerState.ELEMENT_REF
        }
        read = false;
        break;

      // A tag can span multiple lines: tabs and line breaks separate its bindings exactly like spaces
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.skipSpaces();
        break;

      case GREATER_THEN:
      case SLASH:
        retVal = {
          state: LexerState.TAG_OPEN_END,
          popState: true
        }
        read = false;
        break;

      case LPAREN:
        retVal = {
          state: LexerState.EVENT
        }
        read = false;
        break;

      default:
        retVal = {
          state: expectsTemplateDeclaration(context.tokens) ? LexerState.TEMPLATE_DECLARATION : LexerState.ATTRIBUTE
        }
        read = false;
    }
  }

  return retVal
}