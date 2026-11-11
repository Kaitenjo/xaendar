import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { TryNode } from '../../../parser/types/nodes/try-node.type';
import { GeneratorContext } from '../../context/context';
import { generateTry } from './generate-try.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TryNode;

describe('generateTry', () => {
  it('passes the functions rendering the content and the @catch, each one a scope of its own rendered before the anchor it receives', async () => {
    const context = new GeneratorContext(cache);
    const node = parse('@try { <b></b> } @catch (failure) { <i></i> }');
    const { code, functionsToProcess } = await generateTry(node, 'root', '0', context, null);

    expect(code).toEqual(['_try(root, context, null, try0$try);']);
    expect(context.constantDeclarations).toEqual(['const try0$try = { content: try0, catch: catch0 };']);
    expect([...functionsToProcess!.keys()]).toEqual(['try0', 'catch0']);
    expect(functionsToProcess!.get('try0')).toMatchObject({
      fn: { node, parentNode: 'try0', anchor: 'anchor' },
      args: ['try0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('catch0')).toMatchObject({
      fn: { node: node.catch, parentNode: 'catch0', precode: 'context.addIdentifier(\'failure\', error);', anchor: 'anchor' },
      args: ['catch0', 'parentContext', 'anchor', 'nodeStrategy', 'error']
    });
    expect(functionsToProcess!.get('try0')!.fn.context).not.toBe(context);
  });

  it('declares the error in the scope of the @catch only, as a value', async () => {
    const { functionsToProcess } = await generateTry(parse('@try { a } @catch (failure) { b }'), 'root', '0', new GeneratorContext(cache), null);

    expect(functionsToProcess!.get('try0')!.fn.context.hasIdentifier('failure')).toBe(false);
    expect(functionsToProcess!.get('catch0')!.fn.context.getIdentifierKind('failure')).toBe('value');
  });

  it('declares no error for a @catch without a name', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateTry(parse('@try { a } @catch { b }'), 'root', '2', context, 'anchor');

    expect(code).toEqual(['_try(root, context, anchor, try2$try);']);
    expect(context.constantDeclarations).toEqual(['const try2$try = { content: try2, catch: catch2 };']);
    expect(functionsToProcess!.get('catch2')!.fn.precode).toBeUndefined();
  });
});
