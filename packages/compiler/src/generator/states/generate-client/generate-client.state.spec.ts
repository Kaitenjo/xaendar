import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateClient } from './generate-client.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ClientNode;

describe('generateClient', () => {
  it('passes the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new CompilerContext();
    const { code, functionsToProcess } = await generateClient(parse('@client { <b></b> }'), 'root', '0', context, null);

    expect(code).toEqual(['_client(root, context, null, client0.bind(this));']);
    expect([...functionsToProcess!.keys()]).toEqual(['client0']);
    expect(functionsToProcess!.get('client0')).toMatchObject({
      fn: { parentNode: 'client0', anchor: 'anchor' },
      args: ['client0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('client0')!.fn.context).not.toBe(context);
  });

  it('renders the block before the anchor of the code, and generates nothing for the placeholder', async () => {
    const { code, functionsToProcess } = await generateClient(parse('@client { <b></b> } @placeholder { <i></i> }'), 'root', '1', new CompilerContext(), 'anchor');

    expect(code).toEqual(['_client(root, context, anchor, client1.bind(this));']);
    expect([...functionsToProcess!.keys()]).toEqual(['client1']);
  });
});
