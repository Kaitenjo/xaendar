import { describe, expect, it } from 'vitest';
import { getTemplateSpan } from '../expression-validator/expression-validator';
import { parseHydrateTriggers } from './hydrate-triggers.utils';

describe('parseHydrateTriggers', () => {
  it('parses the triggers written by name, with where each one is written', () => {
    const source = 'load, idle ,visible,  interaction';

    expect(parseHydrateTriggers(source, 10)).toEqual([
      { kind: 'load', span: { start: 10, end: 14 } },
      { kind: 'idle', span: { start: 16, end: 20 } },
      { kind: 'visible', span: { start: 22, end: 29 } },
      { kind: 'interaction', span: { start: 32, end: 43 } }
    ]);
  });

  it('parses the expression of when, located in the template', () => {
    const template = '@hydrate (idle, when ready(a, b)) {';
    const start = template.indexOf('(') + 1;
    const [, when] = parseHydrateTriggers(template.slice(start, template.lastIndexOf(')')), start);

    expect(when).toMatchObject({ kind: 'when', expression: 'ready(a, b)' });
    const span = when.kind === 'when' ? getTemplateSpan(when.expressionNode) : undefined;
    expect(span && template.slice(span.start, span.end)).toBe('ready(a, b)');
  });

  it('separates nothing on the commas inside brackets, braces and string literals', () => {
    const [when, idle] = parseHydrateTriggers('when f([1, 2], { a: 1, b: \'x,\\\'y\' }, "c,d", `e,f`), idle', 0);

    expect(when).toMatchObject({ kind: 'when', expression: 'f([1, 2], { a: 1, b: \'x,\\\'y\' }, "c,d", `e,f`)' });
    expect(idle).toMatchObject({ kind: 'idle' });
  });

  it.each([
    ['nothing', ''],
    ['an empty trigger', 'idle, ']
  ])('throws for %s', (_name, source) => {
    expect(() => parseHydrateTriggers(source, 0)).toThrow('@hydrate needs a trigger: load, idle, visible, interaction, never, or when followed by an expression');
  });

  it('throws for an unknown trigger', () => {
    expect(() => parseHydrateTriggers('hover', 0)).toThrow('Unknown @hydrate trigger "hover": use load, idle, visible, interaction, never, or when followed by an expression');
  });

  it('parses never written alone', () => {
    expect(parseHydrateTriggers('never', 0)).toEqual([{ kind: 'never', span: { start: 0, end: 5 } }]);
  });

  it.each([
    ['after', 'idle, never', { start: 6, end: 11 }],
    ['before', 'never, when ready()', { start: 0, end: 5 }]
  ])('throws for never written %s another trigger, at never', (_name, source, cause) => {
    expect(() => parseHydrateTriggers(source, 0)).toThrow(expect.objectContaining({ message: 'The trigger "never" stands alone: any other trigger would hydrate the content', cause }));
  });

  it('throws for a trigger declared twice', () => {
    expect(() => parseHydrateTriggers('when a, idle, when b', 0)).toThrow('The trigger "when" is declared twice');
  });

  it('throws for an expression of when holding a construct not allowed in the templates', () => {
    expect(() => parseHydrateTriggers('when await a', 0)).toThrow('is not allowed inside template expressions');
  });
});
