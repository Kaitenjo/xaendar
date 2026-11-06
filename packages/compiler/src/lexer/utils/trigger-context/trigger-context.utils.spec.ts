import { describe, expect, it } from 'vitest';
import { getTriggerContext, isTriggerExpression } from './trigger-context.utils';

/**
 * Returns the trigger context at the `|` marking the offset of a template, with the text its span covers.
 */
const contextOf = (template: string) => {
  const source = template.replace('|', '');
  const context = getTriggerContext(source, template.indexOf('|'));
  return context && { names: context.names, written: source.slice(context.span.start, context.span.end) };
};

describe('getTriggerContext', () => {
  it('proposes the triggers of a @defer, when and prefetch, on the name being written', () => {
    expect(contextOf('@defer (|')).toEqual({ names: ['load', 'idle', 'timer', 'visible', 'interaction', 'hover', 'when', 'prefetch'], written: '' });
    expect(contextOf('@defer (ho|')).toEqual({ names: ['load', 'idle', 'timer', 'visible', 'interaction', 'hover', 'when', 'prefetch'], written: 'ho' });
  });

  it('proposes never in a @hydrate only alone', () => {
    expect(contextOf('@hydrate (|')!.names).toContain('never');
    expect(contextOf('@hydrate (idle, |')!.names).not.toContain('never');
  });

  it('leaves out the triggers written in the same list, the one of prefetch apart', () => {
    expect(contextOf('@defer (idle, hover(more), when a(), |')).toEqual({ names: ['load', 'timer', 'visible', 'interaction', 'prefetch'], written: '' });
    expect(contextOf('@hydrate (idle, prefetch idle, prefetch |')).toEqual({ names: ['load', 'timer', 'visible', 'interaction', 'hover', 'when'], written: '' });
  });

  it('proposes the parameters of a @placeholder and of a @loading not written yet', () => {
    expect(contextOf('@defer { a } @placeholder (|')).toEqual({ names: ['minimum'], written: '' });
    expect(contextOf('@defer { a } @loading (af|')).toEqual({ names: ['after', 'minimum'], written: 'af' });
    expect(contextOf('@defer { a } @loading (after 1s, |')).toEqual({ names: ['minimum'], written: '' });
    expect(contextOf('@defer { a } @loading (1s, |')).toEqual({ names: ['after', 'minimum'], written: '' });
  });

  it.each([
    ['text', 'hello|'],
    ['a template that cannot be lexed', '<b (click="|'],
    ['the condition of an @if', '@if (|'],
    ['a @defer before its parentheses', '@defer |'],
    ['the expression of a when', '@defer (when a|'],
    ['the arguments of a trigger', '@defer (hover(|'],
    ['the value of a parameter', '@defer { a } @loading (after |']
  ])('finds no name in %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});

describe('isTriggerExpression', () => {
  it.each([
    ['the expression of a when', 'idle, when ', true],
    ['the expression of a when following prefetch', 'prefetch when ', true],
    ['the arguments of a trigger', 'idle, hover(', true],
    ['the options of visible, a parenthesis in a string', 'visible({ rootMargin: \')\', threshold: [', true],
    ['the name of a trigger', 'idle, ', false],
    ['after the arguments of a trigger', 'hover(more)', false],
    ['a when not followed by its expression', 'when', false]
  ])('tells %s', (_name, text, expected) => {
    expect(isTriggerExpression(text)).toBe(expected);
  });
});
