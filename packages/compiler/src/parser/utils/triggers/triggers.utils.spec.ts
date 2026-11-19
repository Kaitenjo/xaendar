import { describe, expect, it } from 'vitest';
import { getTemplateSpan } from '../expression-validator/expression-validator';
import type { ElementTrigger } from '../../types/triggers/element-trigger.type';
import { parseDeferTriggers, parseHydrateTriggers } from './triggers.utils';

/**
 * The triggers a `@hydrate` accepts, as its errors name them.
 */
const HYDRATE_ACCEPTED = 'load, idle, timer, visible, interaction, hover, never, or when followed by an expression, each one after prefetch to load the modules only';

/**
 * The triggers a `@defer` accepts, as its errors name them.
 */
const DEFER_ACCEPTED = 'load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only';

/**
 * Parses the triggers between the parentheses of a block, returning them with the template.
 */
const parseIn = (template: string) => {
  const start = template.indexOf('(') + 1;
  return parseDeferTriggers(template.slice(start, template.lastIndexOf(')')), start);
};

describe('parseHydrateTriggers', () => {
  it('parses the triggers written by name, with where each one is written', () => {
    const source = 'load, idle ,visible,  interaction, hover';

    expect(parseHydrateTriggers(source, 10)).toEqual({
      triggers: [
        { kind: 'load', span: { start: 10, end: 14 } },
        { kind: 'idle', span: { start: 16, end: 20 } },
        { kind: 'visible', span: { start: 22, end: 29 } },
        { kind: 'interaction', span: { start: 32, end: 43 } },
        { kind: 'hover', span: { start: 45, end: 50 } }
      ],
      prefetch: []
    });
  });

  it('parses the expression of when, located in the template', () => {
    const template = '@hydrate (idle, when ready(a, b)) {';
    const start = template.indexOf('(') + 1;
    const { triggers: [, when] } = parseHydrateTriggers(template.slice(start, template.lastIndexOf(')')), start);

    expect(when).toMatchObject({ kind: 'when', expression: 'ready(a, b)' });
    const span = when.kind === 'when' ? getTemplateSpan(when.expressionNode) : undefined;
    expect(span && template.slice(span.start, span.end)).toBe('ready(a, b)');
  });

  it('separates nothing on the commas inside brackets, braces and string literals', () => {
    const { triggers: [when, idle] } = parseHydrateTriggers('when f([1, 2], { a: 1, b: \'x,\\\'y\' }, "c,d", `e,f`), idle', 0);

    expect(when).toMatchObject({ kind: 'when', expression: 'f([1, 2], { a: 1, b: \'x,\\\'y\' }, "c,d", `e,f`)' });
    expect(idle).toMatchObject({ kind: 'idle' });
  });

  it('parses the triggers following prefetch apart, the span of each one starting after prefetch', () => {
    expect(parseHydrateTriggers('interaction, prefetch idle, prefetch when ready()', 0)).toMatchObject({
      triggers: [{ kind: 'interaction' }],
      prefetch: [
        { kind: 'idle', span: { start: 22, end: 26 } },
        { kind: 'when', expression: 'ready()', span: { start: 37, end: 49 } }
      ]
    });
  });

  it('accepts the options of the observer of visible, but no element ref', () => {
    expect(parseHydrateTriggers('visible({ rootMargin: \'10px\' })', 0).triggers).toMatchObject([{ kind: 'visible', options: { expression: '{ rootMargin: \'10px\' }' } }]);
    expect(() => parseHydrateTriggers('hover(more)', 0)).toThrow(expect.objectContaining({
      message: 'A trigger of @hydrate watches the elements of its content: it takes no element ref',
      cause: { start: 6, end: 10 }
    }));
  });

  it.each([
    ['nothing', ''],
    ['an empty trigger', 'idle, ']
  ])('throws for %s', (_name, source) => {
    expect(() => parseHydrateTriggers(source, 0)).toThrow(`@hydrate needs a trigger: use ${HYDRATE_ACCEPTED}`);
  });

  it('throws for prefetch without a trigger, at prefetch', () => {
    expect(() => parseHydrateTriggers('idle, prefetch', 0)).toThrow(expect.objectContaining({
      message: `@hydrate needs a trigger after prefetch: use ${HYDRATE_ACCEPTED}`,
      cause: { start: 6, end: 14 }
    }));
  });

  it.each(['viewport', 'idle-ish', '(idle)'])('throws for the unknown trigger "%s"', source => {
    expect(() => parseHydrateTriggers(source, 0)).toThrow(`Unknown @hydrate trigger "${source}": use ${HYDRATE_ACCEPTED}`);
  });

  it('parses never written alone', () => {
    expect(parseHydrateTriggers('never', 0)).toEqual({ triggers: [{ kind: 'never', span: { start: 0, end: 5 } }], prefetch: [] });
  });

  it.each([
    ['after another trigger', 'idle, never', { start: 6, end: 11 }],
    ['before another trigger', 'never, when ready()', { start: 0, end: 5 }],
    ['with a trigger following prefetch', 'never, prefetch idle', { start: 0, end: 5 }]
  ])('throws for never written %s, at never', (_name, source, cause) => {
    expect(() => parseHydrateTriggers(source, 0)).toThrow(expect.objectContaining({ message: 'The trigger "never" stands alone: any other trigger would hydrate the content', cause }));
  });

  it('throws for never following prefetch', () => {
    expect(() => parseHydrateTriggers('idle, prefetch never', 0)).toThrow(expect.objectContaining({
      message: 'The trigger "never" loads nothing: it cannot follow prefetch',
      cause: { start: 15, end: 20 }
    }));
  });

  it('throws for a trigger declared twice in the same list, accepting it once in each one', () => {
    expect(() => parseHydrateTriggers('when a, idle, when b', 0)).toThrow('The trigger "when" is declared twice');
    expect(() => parseHydrateTriggers('prefetch idle, prefetch idle(1s)', 0)).toThrow('The trigger "prefetch idle" is declared twice');
    expect(parseHydrateTriggers('idle, prefetch idle', 0).prefetch).toHaveLength(1);
  });

  it('throws for an expression of when holding a construct not allowed in the templates', () => {
    expect(() => parseHydrateTriggers('when await a', 0)).toThrow('is not allowed inside template expressions');
  });
});

describe('parseDeferTriggers', () => {
  it('parses the triggers of a @hydrate but never', () => {
    expect(parseDeferTriggers('interaction, when ready()', 8)).toMatchObject({
      triggers: [
        { kind: 'interaction', span: { start: 8, end: 19 } },
        { kind: 'when', expression: 'ready()', span: { start: 21, end: 33 } }
      ],
      prefetch: []
    });
  });

  it('throws for never, naming the triggers of a @defer', () => {
    expect(() => parseDeferTriggers('never', 0)).toThrow(expect.objectContaining({
      message: `Unknown @defer trigger "never": use ${DEFER_ACCEPTED}`,
      cause: { start: 0, end: 5 }
    }));
    expect(() => parseDeferTriggers('', 0)).toThrow(`@defer needs a trigger: use ${DEFER_ACCEPTED}`);
  });

  it('parses the durations of idle and timer, in milliseconds', () => {
    expect(parseDeferTriggers('idle(500), timer(1.5s), prefetch timer (2s)', 0)).toMatchObject({
      triggers: [{ kind: 'idle', timeout: 500 }, { kind: 'timer', delay: 1500 }],
      prefetch: [{ kind: 'timer', delay: 2000 }]
    });
    expect(parseDeferTriggers('idle', 0).triggers[0]).not.toHaveProperty('timeout');
  });

  it('parses the element refs naming the elements to watch, located in the template', () => {
    const template = '@defer (hover(more), interaction( button ), visible(list), prefetch hover(more)) {';
    const { triggers, prefetch } = parseIn(template);

    expect(triggers).toMatchObject([
      { kind: 'hover', target: { name: 'more' } },
      { kind: 'interaction', target: { name: 'button' } },
      { kind: 'visible', target: { name: 'list' } }
    ]);
    expect(prefetch).toMatchObject([{ kind: 'hover', target: { name: 'more' } }]);
    const { target } = triggers[1] as ElementTrigger;
    expect(template.slice(target!.span.start, target!.span.end)).toBe('button');
    const span = getTemplateSpan(target!.expressionNode);
    expect(template.slice(span!.start, span!.end)).toBe('button');
  });

  it('parses the options of visible, alone or after the element ref', () => {
    const template = '@defer (visible(list, { rootMargin: \'200px\', threshold: [0, 1] }), prefetch visible({ threshold: 0.5 })) {';
    const { triggers: [visible], prefetch: [prefetchVisible] } = parseIn(template);

    expect(visible).toMatchObject({ kind: 'visible', target: { name: 'list' }, options: { expression: '{ rootMargin: \'200px\', threshold: [0, 1] }' } });
    expect(prefetchVisible).not.toHaveProperty('target');
    expect(prefetchVisible).toMatchObject({ kind: 'visible', options: { expression: '{ threshold: 0.5 }' } });
    const { options } = visible as Extract<typeof visible, { kind: 'visible' }>;
    expect(template.slice(options!.span.start, options!.span.end)).toBe('{ rootMargin: \'200px\', threshold: [0, 1] }');
  });

  it.each([
    ['timer', 'The trigger "timer" needs a duration, such as timer(500ms)', 'timer'],
    ['timer()', 'Expected a duration, such as 500ms or 1s, got ""', ''],
    ['idle(soon)', 'Expected a duration, such as 500ms or 1s, got "soon"', 'soon'],
    ['load()', 'The trigger "load" takes no arguments', 'load()'],
    ['idle(1, 2)', 'The trigger "idle" takes at most one argument', 'idle(1, 2)'],
    ['timer(1s, 2s)', 'The trigger "timer" takes at most one argument', 'timer(1s, 2s)'],
    ['hover(a, b)', 'The trigger "hover" takes at most one argument', 'hover(a, b)'],
    ['visible(a, {}, b)', 'The trigger "visible" takes at most 2 arguments', 'visible(a, {}, b)'],
    ['hover(a.b)', 'Expected the element ref naming the element to watch, got "a.b"', 'a.b'],
    ['interaction()', 'Expected the element ref naming the element to watch, got ""', ''],
    ['visible({ a: 1 }, list)', 'Expected the element ref naming the element to watch, got "{ a: 1 }"', '{ a: 1 }'],
    ['visible(list, margin)', 'Expected the options of the observer as an object literal, such as { rootMargin: \'200px\' }, got "margin"', 'margin']
  ])('throws for %s, at what is wrong', (source, message, text) => {
    const template = `@defer (${source}) {`;
    let error: Error | undefined;
    try {
      parseIn(template);
    } catch (thrown) {
      error = thrown as Error;
    }

    expect(error?.message).toBe(message);
    const { start, end } = error!.cause as { start: number, end: number };
    expect(template.slice(start, end)).toBe(text);
  });
});
