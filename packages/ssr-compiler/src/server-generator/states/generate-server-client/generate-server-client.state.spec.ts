import { GeneratorContext, parseTemplate, type ClientNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerClient } from './generate-server-client.state';

const cache = {} as ContextCache;

describe('generateServerClient', () => {
  it('writes only the markers of a block without a placeholder', () => {
    const node = parseTemplate('@client { <b></b> }')[0] as ClientNode;

    expect(generateServerClient(node, { id: 'ul0', tag: 'ul' }, '2', new GeneratorContext(cache))).toEqual({
      pieces: [{ html: '<!--xd-c-->' }, { html: '<!--/xd-c-->' }]
    });
  });

  it('renders the placeholder between the markers of the block, through a function of its own, not the content', () => {
    const node = parseTemplate('@client { <b></b> } @placeholder { <i></i> }')[0] as ClientNode;

    const { pieces, functionsToProcess } = generateServerClient(node, { id: 'ul0', tag: 'ul' }, '2', new GeneratorContext(cache));

    expect(pieces).toEqual([
      { html: '<!--xd-c-->' },
      { statement: 'ul0__placeholder2.call(this, out, context);' },
      { html: '<!--/xd-c-->' }
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__placeholder2']);
    expect(functionsToProcess!.get('ul0__placeholder2')!.fn).toMatchObject({ node: node.placeholder, parent: { id: 'ul0__placeholder2', tag: 'ul', end: false } });
  });

  it('writes no closing marker for the last node of its parent without a placeholder', () => {
    const node = parseTemplate('@client { <b></b> }')[0] as ClientNode;

    expect(generateServerClient(node, { id: 'ul0', tag: 'ul', end: true }, '2', new GeneratorContext(cache), undefined, true)).toEqual({
      pieces: [{ html: '<!--xd-c-->' }]
    });
  });

  it('writes no closing marker for the last node of its parent, its placeholder ending where the parent does', () => {
    const node = parseTemplate('@client { <b></b> } @placeholder { <i></i> }')[0] as ClientNode;

    const { pieces, functionsToProcess } = generateServerClient(node, { id: 'ul0', tag: 'ul', end: true }, '2', new GeneratorContext(cache), undefined, true);

    expect(pieces).toEqual([{ html: '<!--xd-c-->' }, { statement: 'ul0__placeholder2.call(this, out, context);' }]);
    expect(functionsToProcess!.get('ul0__placeholder2')!.fn.parent).toEqual({ id: 'ul0__placeholder2', tag: 'ul', end: true });
  });
});
