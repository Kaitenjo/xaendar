import { CompilerContext, parseTemplate, type IfNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerIf } from './generate-server-if.state';

describe('generateServerIf', () => {
  it('renders the block of the first branch whose condition holds, through functions named like the ones of the client', () => {
    const node = parseTemplate('@if (a()) { 1 } @else if (b) { 2 } @else if (c) { 3 } @else { 4 }')[0] as IfNode;
    const context = new CompilerContext();
    context.addSignalClassField('a');

    const { pieces, functionsToProcess } = generateServerIf(node, { id: 'ul0', tag: 'ul' }, '2', context);

    expect(pieces).toEqual([{
      statement: [
        'if (this.a()) {',
        '  ul0__if2.call(this, out, context);',
        '} else if (this.b) {',
        '  ul0__elseIf2_0.call(this, out, context);',
        '} else if (this.c) {',
        '  ul0__elseIf2_1.call(this, out, context);',
        '} else {',
        '  ul0__else2.call(this, out, context);',
        '}'
      ].join('\n')
    }]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__if2', 'ul0__elseIf2_0', 'ul0__elseIf2_1', 'ul0__else2']);
    expect(functionsToProcess!.get('ul0__else2')!.fn.parent).toEqual({ id: 'ul0__else2', tag: 'ul' });
  });

  it('renders nothing without an @else when no condition holds', () => {
    const node = parseTemplate('@if (visible) { 1 }')[0] as IfNode;

    const { pieces } = generateServerIf(node, { id: 'root' }, '0', new CompilerContext());

    expect(pieces).toEqual([{ statement: 'if (this.visible) {\n  if0.call(this, out, context);\n}' }]);
  });
});
