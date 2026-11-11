import { GeneratorContext, parseTemplate, type HydrateNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerHydrate } from './generate-server-hydrate.state';

const cache = {} as ContextCache;

describe('generateServerHydrate', () => {
  it('renders the content between the markers of the block, through a function named like the one of the client', () => {
    const node = parseTemplate('@hydrate (visible, when ready()) { <b></b> }')[0] as HydrateNode;

    const { pieces, functionsToProcess } = generateServerHydrate(node, { id: 'ul0', tag: 'ul' }, '2', new GeneratorContext(cache));

    expect(pieces).toEqual([
      { html: '<!--xd-h-->' },
      { statement: 'ul0__hydrate2.call(this, out, context);' },
      { html: '<!--/xd-h-->' }
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__hydrate2']);
    expect(functionsToProcess!.get('ul0__hydrate2')!.fn).toMatchObject({ node, parent: { id: 'ul0__hydrate2', tag: 'ul', end: false } });
  });

  it('writes no closing marker for the last node of its parent, its content ending where the parent does', () => {
    const node = parseTemplate('@hydrate (idle) { <b></b> }')[0] as HydrateNode;

    const { pieces, functionsToProcess } = generateServerHydrate(node, { id: 'ul0', tag: 'ul', end: true }, '2', new GeneratorContext(cache), undefined, true);

    expect(pieces).toEqual([{ html: '<!--xd-h-->' }, { statement: 'ul0__hydrate2.call(this, out, context);' }]);
    expect(functionsToProcess!.get('ul0__hydrate2')!.fn.parent).toEqual({ id: 'ul0__hydrate2', tag: 'ul', end: true });
  });
});
