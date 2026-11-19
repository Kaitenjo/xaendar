import { LexerState } from '../../types/lexer-state.enum';

/**
 * Resolves the state lexing the bindings of a tag once a binding has been consumed.
 *
 * Bindings can be declared directly in the tag body or inside a construct opened in it,
 * i.e. a block of a conditional binding `@if (condition) { ... }`, a directive `@@selector(...)` or a structural
 * directive `*selector(...)`: the lexer
 * pushes the state opening the construct onto the state stack, so the state at the position
 * the caller knows to hold it identifies where the lexing has to resume.
 *
 * @param openingState - The state found at the stack position of the construct the binding belongs to, if any.
 * @returns The state lexing the body of the construct, or `TAG_BODY` if the binding is declared directly in the tag body.
 */
export function resolveTagBodyState(openingState: LexerState | undefined): LexerState {
  switch (openingState) {
    case LexerState.FLOW_CONTROL_BLOCK:
      return LexerState.CONDITIONAL_BINDING_BODY;

    case LexerState.DIRECTIVE:
    case LexerState.STRUCTURAL_DIRECTIVE:
      return LexerState.DIRECTIVE_BODY;

    default:
      return LexerState.TAG_BODY;
  }
}
