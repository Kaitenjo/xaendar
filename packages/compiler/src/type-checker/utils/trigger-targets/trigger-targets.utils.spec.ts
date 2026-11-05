import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { checkTriggerTargets } from './trigger-targets.utils';

/**
 * Checks a template, returning for each error the text of the template it points to.
 */
const check = (template: string) => checkTriggerTargets(parseTemplate(template)).map(error => {
  const { start, end } = error.cause as { start: number, end: number };
  return template.slice(start, end);
});

describe('checkTriggerTargets', () => {
  it('rejects a @client without a @placeholder, at the trigger, telling what to add', () => {
    const [error] = checkTriggerTargets(parseTemplate('@hydrate (visible) { @client { <b></b> } }'));

    expect(error.message).toBe('The trigger "visible" watches the elements the server renders, and this @hydrate renders none: add an element, or a @placeholder holding one to its @client');
    expect(check('@hydrate (visible) { @client { <b></b> } }')).toEqual(['visible']);
  });

  it.each([
    ['interaction', '@hydrate (interaction) { @client { <b></b> } }', 'interaction'],
    ['the first trigger watching elements, next to others', '@hydrate (idle, when a(), interaction, visible) { @client { <b></b> } }', 'interaction'],
    ['a @placeholder without elements', '@hydrate (visible) { @client { <b></b> } @placeholder { Loading } }', 'visible'],
    ['a text', '@hydrate (visible) { text }', 'visible'],
    ['an interpolation', '@hydrate (visible) { { a() } }', 'visible'],
    ['nothing', '@hydrate (visible) { }', 'visible'],
    ['a @let', '@hydrate (visible) { @let a = b; }', 'visible'],
    ['a template, not rendered there', '@hydrate (visible) { <template row()><b></b></template> }', 'visible'],
    ['a @hydrate holding nothing to watch', '@hydrate (idle) { @hydrate (visible) { text } }', 'visible']
  ])('rejects %s', (_name, template, trigger) => {
    expect(check(template)).toEqual([trigger]);
  });

  it.each([
    ['an element', '@hydrate (visible) { <b></b> }'],
    ['a @placeholder holding an element', '@hydrate (visible) { @client { <b></b> } @placeholder { <i></i> } }'],
    ['an element next to a @client', '@hydrate (interaction) { @client { <b></b> } <i></i> }'],
    ['a block that may render an element', '@hydrate (visible) { @if (a()) { <b></b> } }'],
    ['a @render', '@hydrate (visible) { @render row() }'],
    ['triggers watching no element', '@hydrate (idle, load, when a()) { text }'],
    ['never', '@hydrate (never) { @client { <b></b> } }'],
    ['a @hydrate holding an element in another @hydrate', '@hydrate (visible) { @hydrate (idle) { <b></b> } }']
  ])('accepts %s', (_name, template) => {
    expect(check(template)).toEqual([]);
  });

  it.each([
    ['an element', '<div>@hydrate (visible) { text }</div>'],
    ['an @if', '@if (a()) { @hydrate (visible) { text } }'],
    ['an @else', '@if (a()) { <b></b> } @else { @hydrate (visible) { text } }'],
    ['a @for', '@for (item of items(); track item()) { @hydrate (visible) { text } }'],
    ['a @switch', '@switch (a()) { @case (1) { @hydrate (visible) { text } } }'],
    ['a template', '<template row()>@hydrate (visible) { text }</template>'],
    ['a @client', '@client { @hydrate (visible) { text } }'],
    ['a @placeholder', '@client { <b></b> } @placeholder { @hydrate (visible) { text } }'],
    ['another @hydrate', '@hydrate (idle) { <b></b> @hydrate (visible) { text } }']
  ])('finds a @hydrate inside %s', (_name, template) => {
    expect(check(template)).toEqual(['visible']);
  });

  it('reports every @hydrate failing', () => {
    expect(check('@hydrate (visible) { text } @hydrate (interaction) { text } <p></p>')).toEqual(['visible', 'interaction']);
  });

  describe('a @defer', () => {
    it('rejects one without a @placeholder, whatever its content, at the trigger, telling what to add', () => {
      const [error] = checkTriggerTargets(parseTemplate('@defer (interaction) { <b></b> }'));

      expect(error.message).toBe('The trigger "interaction" watches the elements of the @placeholder, and this @defer renders none before its trigger: add a @placeholder holding an element');
      expect(check('@defer (idle, visible) { <b></b> } @loading { <i></i> }')).toEqual(['visible']);
    });

    it.each([
      ['a text', '@defer (visible) { <b></b> } @placeholder { Loading }'],
      ['a @defer without a @placeholder', '@defer (visible) { <b></b> } @placeholder { @defer (idle) { <i></i> } }'],
      ['a @client without a @placeholder', '@defer (visible) { <b></b> } @placeholder { @client { <i></i> } }']
    ])('rejects a @placeholder holding %s', (_name, template) => {
      expect(check(template)).toEqual(['visible']);
    });

    it.each([
      ['an element', '@defer (visible) { text } @placeholder { <i></i> }'],
      ['a @defer whose @placeholder holds an element', '@defer (interaction) { text } @placeholder { @defer (idle) { text } @placeholder { <i></i> } }'],
      ['triggers watching no element', '@defer (idle, load, when a()) { text }']
    ])('accepts %s', (_name, template) => {
      expect(check(template)).toEqual([]);
    });

    it('lets a @hydrate watch the @placeholder of a @defer in its content, which the server renders', () => {
      expect(check('@hydrate (visible) { @defer (idle) { text } @placeholder { <i></i> } }')).toEqual([]);
      expect(check('@hydrate (visible) { @defer (idle) { <i></i> } }')).toEqual(['visible']);
    });
  });
});
