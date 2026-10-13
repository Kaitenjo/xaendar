import { describe, expect, it } from 'vitest';
import { TemplateError } from './template-error.model';

describe('TemplateError', () => {
  it('keeps the formatted message, the span and the detail', () => {
    const error = new TemplateError('[Parser] [Ln 1, Col 1] - boom\n ---> <div', { start: 0, end: 4 }, 'boom');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TemplateError');
    expect(error.message).toBe('[Parser] [Ln 1, Col 1] - boom\n ---> <div');
    expect(error.span).toEqual({ start: 0, end: 4 });
    expect(error.detail).toBe('boom');
  });

  it('prints exactly its message, like a thrown string', () => {
    const error = new TemplateError('[Lexer] boom', { start: 0, end: 1 }, 'boom');

    expect(`${error}`).toBe('[Lexer] boom');
    expect(error.toString()).toBe('[Lexer] boom');
    expect(error.stack).toBe('');
  });
});
