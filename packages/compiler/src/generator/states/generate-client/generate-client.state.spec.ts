import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { GeneratorContext } from '../../context/context';
import { generateClient } from './generate-client.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ClientNode;

describe('generateClient', () => {
  it('passes the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateClient(parse('@client { <b></b> }'), 'root', '0', context, null);

    expect(code).toEqual(['_client(root, context, null, client0);']);
    expect([...functionsToProcess!.keys()]).toEqual(['client0']);
    expect(functionsToProcess!.get('client0')).toMatchObject({
      fn: { parentNode: 'client0', anchor: 'anchor' },
      args: ['client0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('client0')!.fn.context).not.toBe(context);
  });

  it('renders the block before the anchor of the code, and generates nothing for the placeholder', async () => {
    const { code, functionsToProcess } = await generateClient(parse('@client { <b></b> } @placeholder { <i></i> }'), 'root', '1', new GeneratorContext(cache), 'anchor');

    expect(code).toEqual(['_client(root, context, anchor, client1);']);
    expect([...functionsToProcess!.keys()]).toEqual(['client1']);
  });

  it('passes true for the last node of its parent, its content forwarding no anchor', async () => {
    const { code, functionsToProcess } = await generateClient(parse('@client { <b></b> } @placeholder { <i></i> }'), 'td0', '0', new GeneratorContext(cache), null, false, true);

    expect(code).toEqual(['_client(td0, context, null, td0__client0, true);']);
    expect(functionsToProcess!.get('td0__client0')!.fn).toHaveProperty('anchor', undefined);
  });

  it('passes the slot of its anchor at the top of a scope tracking its nodes', async () => {
    const context = new GeneratorContext(cache);
    context.tracksNodes = true;
    const { code } = await generateClient(parse('@client { <b></b> }'), 'for0', '0', context, 'anchor');

    expect(code).toEqual(['_client(for0, context, anchor, for0__client0, false, 7);']);
  });
});
