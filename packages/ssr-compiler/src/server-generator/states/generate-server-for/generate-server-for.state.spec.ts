import { GeneratorContext, parseTemplate, type ForNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerFor } from './generate-server-for.state';

const cache = {} as ContextCache;

describe('generateServerFor', () => {
  it('renders the body once per item between the markers of the browser, each item opened by the one of its key, declaring the item and the implicit variables the body reads, aliases included, as values', () => {
    const node = parseTemplate('@for (user of users(); track user.id; i = $index) { { i } { user.name } }')[0] as ForNode;
    const context = new GeneratorContext(cache);
    context.addSignalClassField('users');

    const { pieces, functionsToProcess } = generateServerFor(node, { id: 'ul0', tag: 'ul' }, '1', context);

    expect(pieces).toEqual([{
      statement: [
        '{',
        '  const items = _ssrItems(this.users());',
        '  const track = (user, i, $first, $last, $even, $odd) => user.id;',
        '  out.push(\'<!--xd-for-->\');',
        '  for (let index = 0; index < items.length; index++) {',
        '    out.push(_ssrItemMarker(track(items[index], index, index === 0, index === items.length - 1, index % 2 === 0, index % 2 !== 0)));',
        '    ul0__for1.call(this, out, context, items, index);',
        '  }',
        '  out.push(\'<!--/xd-for-->\');',
        '}'
      ].join('\n')
    }]);
    const { fn, args } = functionsToProcess!.get('ul0__for1')!;
    expect(fn.declaration).toBe('const ul0__for1Variables = { used: [\'item\', \'$index\'], names: [\'user\', \'i\'] };');
    expect(fn.precode).toBe('_iterationVariables(context, items, index, ul0__for1Variables);');
    expect(fn.parent).toEqual({ id: 'ul0__for1', tag: 'ul' });
    expect(args).toEqual(['out', 'parentContext', 'items', 'index']);
    expect(fn.context.getIdentifierKind('user')).toBe('variable');
    expect(fn.context.getIdentifierKind('i')).toBe('variable');
    expect(fn.context.getIdentifierKind('$first')).toBeUndefined();
  });

  it('creates no variable when the body reads none', () => {
    const node = parseTemplate('@for (user of users(); track user.id) { x }')[0] as ForNode;

    const { fn } = generateServerFor(node, { id: 'root' }, '0', new GeneratorContext(cache)).functionsToProcess!.get('for0')!;

    expect(fn.precode).toBeUndefined();
    expect(fn.declaration).toBeUndefined();
    expect(fn.context.getIdentifierKind('user')).toBeUndefined();
  });

  it('declares no item when the @for names none', () => {
    const node = parseTemplate('@for (3; track $index) { { $index } }')[0] as ForNode;

    const { pieces, functionsToProcess } = generateServerFor(node, { id: 'root' }, '0', new GeneratorContext(cache));

    expect((pieces[0] as { statement: string }).statement).toContain('const track = (_, $index, $first, $last, $even, $odd) => $index;');
    expect(functionsToProcess!.get('for0')!.fn.declaration).toBe('const for0Variables = { used: [\'$index\'], names: [\'$index\'] };');
  });
});
