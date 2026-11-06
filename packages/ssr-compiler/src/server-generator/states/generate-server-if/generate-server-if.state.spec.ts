import { GeneratorContext, parseTemplate, type IfNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerIf } from './generate-server-if.state';

const cache = {} as ContextCache;

describe('generateServerIf', () => {
  it('renders the block of the first branch whose condition holds, through functions named like the ones of the client, between the markers holding its index', () => {
    const node = parseTemplate('@if (a()) { 1 } @else if (b) { 2 } @else if (c) { 3 } @else { 4 }')[0] as IfNode;
    const context = new GeneratorContext(cache);
    context.addSignalClassField('a');

    const { pieces, functionsToProcess } = generateServerIf(node, { id: 'ul0', tag: 'ul' }, '2', context);

    expect(pieces).toEqual([
      {
        statement: [
          'if (this.a()) {',
          '  out.push(\'<!--xd-if:0-->\');',
          '  ul0__if2.call(this, out, context);',
          '} else if (this.b) {',
          '  out.push(\'<!--xd-if:1-->\');',
          '  ul0__elseIf2_0.call(this, out, context);',
          '} else if (this.c) {',
          '  out.push(\'<!--xd-if:2-->\');',
          '  ul0__elseIf2_1.call(this, out, context);',
          '} else {',
          '  out.push(\'<!--xd-if:3-->\');',
          '  ul0__else2.call(this, out, context);',
          '}'
        ].join('\n')
      },
      { html: '<!--/xd-if-->' }
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['ul0__if2', 'ul0__elseIf2_0', 'ul0__elseIf2_1', 'ul0__else2']);
    expect(functionsToProcess!.get('ul0__else2')!.fn.parent).toEqual({ id: 'ul0__else2', tag: 'ul' });
  });

  it('writes the markers of no branch without an @else when no condition holds', () => {
    const node = parseTemplate('@if (visible) { 1 }')[0] as IfNode;

    const { pieces } = generateServerIf(node, { id: 'root' }, '0', new GeneratorContext(cache));

    expect(pieces).toEqual([
      { statement: 'if (this.visible) {\n  out.push(\'<!--xd-if:0-->\');\n  if0.call(this, out, context);\n} else {\n  out.push(\'<!--xd-if-->\');\n}' },
      { html: '<!--/xd-if-->' }
    ]);
  });
});
