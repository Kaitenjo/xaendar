import { CompilerContext, parseTemplate, type LetNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerLet } from './generate-server-let.state';

describe('generateServerLet', () => {
  it('initializes a @let reading a signal with a signal computing its value', () => {
    const context = new CompilerContext();
    context.addSignalClassField('price');

    expect(generateServerLet(parseTemplate('@let total = price() * 2;')[0] as LetNode, { id: 'root' }, '0', context)).toEqual({
      pieces: [{ statement: 'context.set(\'total\', _let(() => this.price() * 2));' }]
    });
  });

  it('initializes any other @let with its value, reading the globals of the browser through globalThis', () => {
    expect(generateServerLet(parseTemplate('@let width = innerWidth;')[0] as LetNode, { id: 'root' }, '0', new CompilerContext())).toEqual({
      pieces: [{ statement: 'context.set(\'width\', globalThis.innerWidth);' }]
    });
  });
});
