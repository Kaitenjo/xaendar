import { CompilerContext, parseTemplate, type ForNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerFor } from './generate-server-for.state';

describe('generateServerFor', () => {
  it('renders the body once per item, declaring the item and the implicit variables, aliases included, as signals', () => {
    const node = parseTemplate('@for (user of users(); track user().id; i = $index) { x }')[0] as ForNode;
    const context = new CompilerContext();
    context.addSignalClassField('users');

    const { pieces, functionsToProcess } = generateServerFor(node, { id: 'ul0', tag: 'ul' }, '1', context);

    expect(pieces).toEqual([{
      statement: [
        '{',
        '  const items = _ssrItems(this.users());',
        '  for (let index = 0; index < items.length; index++) {',
        '    ul0__for1.call(this, out, context, items, index);',
        '  }',
        '}'
      ].join('\n')
    }]);
    const { fn, args } = functionsToProcess!.get('ul0__for1')!;
    expect(fn.precode).toBe('_iterationVariables(context, items, index, \'user\', { $index: \'i\', $first: \'$first\', $last: \'$last\', $even: \'$even\', $odd: \'$odd\' });');
    expect(fn.parent).toEqual({ id: 'ul0__for1', tag: 'ul' });
    expect(args).toEqual(['out', 'parentContext', 'items', 'index']);
    expect(fn.context.getIdentifierKind('user')).toBe('signal');
    expect(fn.context.getIdentifierKind('i')).toBe('signal');
  });

  it('declares no item when the @for names none', () => {
    const node = parseTemplate('@for (3; track $index()) { x }')[0] as ForNode;

    const { functionsToProcess } = generateServerFor(node, { id: 'root' }, '0', new CompilerContext());

    expect(functionsToProcess!.get('for0')!.fn.precode).toContain('_iterationVariables(context, items, index, undefined, {');
  });
});
