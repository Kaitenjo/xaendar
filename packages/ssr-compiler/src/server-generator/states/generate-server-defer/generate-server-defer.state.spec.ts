import { CompilerContext, parseTemplate, type DeferNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerDefer } from './generate-server-defer.state';

describe('generateServerDefer', () => {
  it('writes only the markers of a block without a placeholder', () => {
    const node = parseTemplate('@defer (idle) { <b></b> } @loading { <i></i> }')[0] as DeferNode;

    expect(generateServerDefer(node, { id: 'ul0', tag: 'ul' }, '2', new CompilerContext())).toEqual({
      pieces: [{ html: '<!--xd-d-->' }, { html: '<!--/xd-d-->' }]
    });
  });

  it('renders the placeholder between the markers of the block, through a function of its own, not the other blocks', () => {
    const node = parseTemplate('@defer (idle) { <b></b> } @placeholder { <i></i> } @loading { <u></u> } @error { <s></s> }')[0] as DeferNode;

    const { pieces, functionsToProcess } = generateServerDefer(node, { id: 'ul0', tag: 'ul' }, '2', new CompilerContext());

    expect(pieces).toEqual([
      { html: '<!--xd-d-->' },
      { statement: 'ul0__placeholder2.call(this, out, context);' },
      { html: '<!--/xd-d-->' }
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__placeholder2']);
    expect(functionsToProcess!.get('ul0__placeholder2')!.fn).toMatchObject({ node: node.placeholder, parent: { id: 'ul0__placeholder2', tag: 'ul' } });
  });
});
