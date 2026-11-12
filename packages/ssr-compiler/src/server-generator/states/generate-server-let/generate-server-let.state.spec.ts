import { GeneratorContext, parseTemplate, type LetNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerLet } from './generate-server-let.state';

const cache = {} as ContextCache;

describe('generateServerLet', () => {
  it('initializes a @let reading a signal with its value, read once', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('price');
    context.addIdentifier('total', 'variable');

    expect(generateServerLet(parseTemplate('@let total = price() * 2;')[0] as LetNode, { id: 'root' }, '0', context)).toEqual({
      pieces: [{ statement: '_set(context, 0, 7, this.price() * 2);' }]
    });
  });

  it('initializes any other @let with its value, reading the globals of the browser through globalThis', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('other');
    context.addIdentifier('width', 'variable');

    // Rendered in the children of an element opening a namespace, which stand for no scope of the runtime
    expect(generateServerLet(parseTemplate('@let width = innerWidth;')[0] as LetNode, { id: 'root' }, '0', new GeneratorContext(context, 'svg', 'declarations'))).toEqual({
      pieces: [{ statement: '_set(context, 0, 8, globalThis.innerWidth);' }]
    });
  });
});
