import { describe, expect, it } from 'vitest';
import { LexerState } from '../../types/lexer-state.enum';
import { resolveTagBodyState } from './tag-body-state.utils';

describe('resolveTagBodyState', () => {
  it('resumes a conditional binding body', () => {
    expect(resolveTagBodyState(LexerState.CONDITIONAL_BINDING_START)).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('resumes a directive body', () => {
    expect(resolveTagBodyState(LexerState.DIRECTIVE)).toBe(LexerState.DIRECTIVE_BODY);
  });

  it('resumes the tag body for any other state', () => {
    expect(resolveTagBodyState(LexerState.TAG_OPEN_NAME)).toBe(LexerState.TAG_BODY);
  });

  it('resumes the tag body when the stack is empty', () => {
    expect(resolveTagBodyState(undefined)).toBe(LexerState.TAG_BODY);
  });
});
