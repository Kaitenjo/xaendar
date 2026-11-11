import { GeneratorContext, parseTemplate, type TryNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerTry } from './generate-server-try.state';

const cache = {} as ContextCache;

describe('generateServerTry', () => {
  it('renders the content and the @catch through functions of their own, the one of the @catch declaring the error as a value', () => {
    const node = parseTemplate('@try { <b></b> } @catch (failure) { <i></i> }')[0] as TryNode;

    const { pieces, functionsToProcess } = generateServerTry(node, { id: 'ul0', tag: 'ul' }, '2', new GeneratorContext(cache));

    expect(pieces).toEqual([{ statement: '_ssrTry(out, context, ul0__try2, ul0__catch2);' }]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__try2', 'ul0__catch2']);
    expect(functionsToProcess!.get('ul0__try2')).toMatchObject({ fn: { node, parent: { id: 'ul0__try2', tag: 'ul' } }, args: ['out', 'parentContext'] });

    const fallback = functionsToProcess!.get('ul0__catch2')!;
    expect(fallback).toMatchObject({ fn: { node: node.catch, parent: { id: 'ul0__catch2', tag: 'ul' }, precode: 'context.addIdentifier(\'failure\', error);' }, args: ['out', 'parentContext', 'error'] });
    expect(fallback.fn.context.getIdentifierKind('failure')).toBe('value');
  });

  it('declares no error for a @catch without a name', () => {
    const node = parseTemplate('@try { a } @catch { b }')[0] as TryNode;

    const { functionsToProcess } = generateServerTry(node, { id: 'root', tag: undefined }, '0', new GeneratorContext(cache));

    expect([...functionsToProcess!.keys()]).toEqual(['try0', 'catch0']);
    expect(functionsToProcess!.get('catch0')!.fn.precode).toBeUndefined();
  });

  it('tells _ssrTry the last node of its parent, written without closing marker, its content and its @catch ending where the parent does', () => {
    const node = parseTemplate('@try { a } @catch { b }')[0] as TryNode;

    const { pieces, functionsToProcess } = generateServerTry(node, { id: 'td0', tag: 'td', end: true }, '0', new GeneratorContext(cache), undefined, true);

    expect(pieces).toEqual([{ statement: '_ssrTry(out, context, td0__try0, td0__catch0, true);' }]);
    expect(functionsToProcess!.get('td0__try0')!.fn.parent).toEqual({ id: 'td0__try0', tag: 'td', end: true });
    expect(functionsToProcess!.get('td0__catch0')!.fn.parent).toEqual({ id: 'td0__catch0', tag: 'td', end: true });
  });

  it('gives the content and the @catch of a block that is not last no end', () => {
    const { functionsToProcess } = generateServerTry(parseTemplate('@try { a } @catch { b }')[0] as TryNode, { id: 'td0', tag: 'td', end: true }, '0', new GeneratorContext(cache), undefined, false);

    expect(functionsToProcess!.get('td0__try0')!.fn.parent).toEqual({ id: 'td0__try0', tag: 'td', end: false });
    expect(functionsToProcess!.get('td0__catch0')!.fn.parent).toEqual({ id: 'td0__catch0', tag: 'td', end: false });
  });
});
