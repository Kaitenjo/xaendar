import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { TypeCheckContext } from '../../models/context/context';
import { typeCheckTriggers } from './triggers.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;

describe('typeCheckTriggers', () => {
  it('reads the expressions of when as conditions, the ones following prefetch too', () => {
    const lines = typeCheckTriggers(parse('@defer (idle, when ready(), prefetch when soon()) { }'), new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual(['if (root.ready()) { }', 'if (root.soon()) { }']);
  });

  it('checks that the element refs name elements, mapped onto the template', () => {
    const template = '@defer (hover(more), interaction(more), visible(list), prefetch hover(more)) { }';
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('more', 'value');
    context.addUnresolvableIdentifier('list', 'value');
    const lines = typeCheckTriggers(parse(template), context);

    expect(lines.map(({ text }) => text)).toEqual([
      'more satisfies Element;',
      'more satisfies Element;',
      'list satisfies Element;',
      'more satisfies Element;'
    ]);
    const [{ original }] = lines[2].mappings!;
    expect(template.slice(original.start, original.end)).toBe('list');
  });

  it('checks the options of the observer of visible against the ones of an IntersectionObserver', () => {
    const lines = typeCheckTriggers(parse('@defer (visible({ rootMargin: margin })) { }'), new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual(['({ rootMargin: root.margin }) satisfies Omit<IntersectionObserverInit, \'root\'>;']);
  });

  it('checks nothing for the triggers reading nothing of the template', () => {
    expect(typeCheckTriggers(parse('@defer (load, idle(1s), timer(2s), hover, prefetch visible) { }'), new TypeCheckContext())).toEqual([]);
  });
});
