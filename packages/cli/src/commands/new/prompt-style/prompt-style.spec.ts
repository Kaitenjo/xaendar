import { beforeEach, describe, expect, it, vi } from 'vitest';

const question = vi.fn();
const close = vi.fn();

vi.mock('node:readline/promises', () => ({
  createInterface: vi.fn(() => ({ question, close }))
}));

import { promptStyle } from './prompt-style';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('promptStyle()', () => {
  it('lists the formats, numbered, in the question', async () => {
    question.mockResolvedValueOnce('');

    await promptStyle();

    expect(question).toHaveBeenCalledWith('? Which stylesheet format would you like to use?\n  1) CSS\n  2) SCSS\n  3) Sass (indented syntax)\n  4) Less\nChoose [1]: ');
  });

  it('picks css on an empty answer', async () => {
    question.mockResolvedValueOnce('  ');

    await expect(promptStyle()).resolves.toBe('css');
  });

  it.each([['2', 'scss'], ['3', 'sass'], ['4', 'less']])('picks a format by its number, %s', async (answer, style) => {
    question.mockResolvedValueOnce(answer);

    await expect(promptStyle()).resolves.toBe(style);
  });

  it('picks a format by its name, ignoring case and spaces', async () => {
    question.mockResolvedValueOnce(' LESS ');

    await expect(promptStyle()).resolves.toBe('less');
  });

  it('asks again after an invalid answer, and closes the terminal interface once answered', async () => {
    question.mockResolvedValueOnce('styl').mockResolvedValueOnce('5').mockResolvedValueOnce('scss');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(promptStyle()).resolves.toBe('scss');

    expect(question).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledWith('✖  Invalid choice: styl');
    expect(consoleErrorSpy).toHaveBeenCalledWith('✖  Invalid choice: 5');
    expect(close).toHaveBeenCalledOnce();
  });

  it('closes the terminal interface when the question fails, e.g. on Ctrl+C', async () => {
    question.mockRejectedValueOnce(new Error('aborted'));

    await expect(promptStyle()).rejects.toThrow('aborted');

    expect(close).toHaveBeenCalledOnce();
  });
});
