import { CompilerContext, parseTemplate, type HydrateNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerHydrate } from './generate-server-hydrate.state';

describe('generateServerHydrate', () => {
  it('renders the content between the markers of the block, through a function named like the one of the client', () => {
    const node = parseTemplate('@hydrate (visible, when ready()) { <b></b> }')[0] as HydrateNode;

    const { pieces, functionsToProcess } = generateServerHydrate(node, { id: 'ul0', tag: 'ul' }, '2', new CompilerContext());

    expect(pieces).toEqual([
      { html: '<!--xd-h-->' },
      { statement: 'ul0__hydrate2.call(this, out, context);' },
      { html: '<!--/xd-h-->' }
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__hydrate2']);
    expect(functionsToProcess!.get('ul0__hydrate2')!.fn).toMatchObject({ node, parent: { id: 'ul0__hydrate2', tag: 'ul' } });
  });
});
