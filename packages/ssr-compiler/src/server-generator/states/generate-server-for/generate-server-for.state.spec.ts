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
        '  out.push(\'<!--xd-for-->\');',
        '  for (let index = 0; index < items.length; index++) {',
        '    out.push(_ssrItemMarker(ul0__for1$track.call(this, context, items[index], index, index === 0, index === items.length - 1, index % 2 === 0, index % 2 !== 0)));',
        '    ul0__for1.call(this, out, context, items, index);',
        '  }',
        '  out.push(\'<!--/xd-for-->\');',
        '}'
      ].join('\n')
    }]);
    expect(context.functionDeclarations).toEqual(['function ul0__for1$track(context, user, i, $first, $last, $even, $odd) {\n  return user.id;\n}']);
    const { fn, args } = functionsToProcess!.get('ul0__for1')!;
    expect(context.constantDeclarations).toEqual(['const ul0__for1Variables = { used: [\'item\', \'$index\'], ids: [0, 1] };']);
    expect(fn.precode).toBe('_iterationVariables(context, items, index, ul0__for1Variables);');
    expect(fn.parent).toEqual({ id: 'ul0__for1', tag: 'ul' });
    expect(args).toEqual(['out', 'parentContext', 'items', 'index']);
    expect(fn.context.getIdentifierKind('user')).toBe('variable');
    expect(fn.context.getIdentifierKind('i')).toBe('variable');
    expect(fn.context.getIdentifierKind('$first')).toBeUndefined();
  });

  it('writes no closing marker for the last node of its parent, its body, whose items move, still not ending there', () => {
    const node = parseTemplate('@for (user of users; track user) { x }')[0] as ForNode;

    const { pieces, functionsToProcess } = generateServerFor(node, { id: 'ul0', tag: 'ul', end: true }, '0', new GeneratorContext(cache), undefined, true);

    expect(pieces).toEqual([{
      statement: [
        '{',
        '  const items = _ssrItems(this.users);',
        '  out.push(\'<!--xd-for-->\');',
        '  for (let index = 0; index < items.length; index++) {',
        '    out.push(_ssrItemMarker(ul0__for0$track.call(this, context, items[index], index, index === 0, index === items.length - 1, index % 2 === 0, index % 2 !== 0)));',
        '    ul0__for0.call(this, out, context, items, index);',
        '  }',
        '}'
      ].join('\n')
    }]);
    expect(functionsToProcess!.get('ul0__for0')!.fn.parent).toEqual({ id: 'ul0__for0', tag: 'ul' });
  });

  it('creates no variable when the body reads none', () => {
    const node = parseTemplate('@for (user of users(); track user.id) { x }')[0] as ForNode;

    const context = new GeneratorContext(cache);
    const { fn } = generateServerFor(node, { id: 'root' }, '0', context).functionsToProcess!.get('for0')!;

    expect(fn.precode).toBeUndefined();
    expect(context.constantDeclarations).toEqual([]);
    expect(fn.context.getIdentifierKind('user')).toBeUndefined();
  });

  it('declares no item when the @for names none', () => {
    const node = parseTemplate('@for (3; track $index) { { $index } }')[0] as ForNode;
    const context = new GeneratorContext(cache);

    const { pieces, functionsToProcess } = generateServerFor(node, { id: 'root' }, '0', context);

    expect((pieces[0] as { statement: string }).statement).toContain('out.push(_ssrItemMarker(for0$track.call(this, context, items[index], index,');
    expect(context.functionDeclarations).toEqual(['function for0$track(context, _, $index, $first, $last, $even, $odd) {\n  return $index;\n}']);
    expect(functionsToProcess!.get('for0')!.fn.precode).toBe('_iterationVariables(context, items, index, for0Variables);');
    expect(context.constantDeclarations).toEqual(['const for0Variables = { used: [\'$index\'], ids: [0] };']);
  });

  it('names the context of the track __context when the item or an alias is named context', () => {
    const context = new GeneratorContext(cache);

    generateServerFor(parseTemplate('@for (context of items(); track context.id) { x }')[0] as ForNode, { id: 'root' }, '0', context);
    generateServerFor(parseTemplate('@for (item of items(); track context; context = $index) { x }')[0] as ForNode, { id: 'root' }, '1', context);

    expect(context.functionDeclarations).toEqual([
      'function for0$track(__context, context, $index, $first, $last, $even, $odd) {\n  return context.id;\n}',
      'function for1$track(__context, item, context, $first, $last, $even, $odd) {\n  return context;\n}'
    ]);
  });
});
