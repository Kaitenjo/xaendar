import { GeneratorContext, parseTemplate, type SwitchNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerSwitch } from './generate-server-switch.state';

const cache = {} as ContextCache;

/**
 * Generates the code of a `@switch` written at the root of a template.
 */
const generate = (source: string) => {
  const context = new GeneratorContext(cache);
  context.addSignalClassField('kind');
  return Object.assign(generateServerSwitch(parseTemplate(source)[0] as SwitchNode, { id: 'root' }, '0', context), { context });
};

/**
 * The piece closing the blocks of a `@switch`.
 */
const CLOSE = { html: '<!--/xd-switch-->' };

describe('generateServerSwitch', () => {
  it('renders the first @case one of whose values matches, or else the @default wherever it is declared, between the markers holding the position of the block', () => {
    const { pieces, functionsToProcess, context } = generate('@switch (kind()) { @default { d } @case (\'a\', \'b\') { ab } @case (1) { one } }');

    expect(pieces).toEqual([
      {
        statement: [
          '{',
          '  const __value = this.kind();',
          '  if (case0_1$values.indexOf(__value) !== -1) {',
          '    out.push(\'<!--xd-switch:1-->\');',
          '    case0_1.call(this, out, context);',
          '  } else if (case0_2$values.indexOf(__value) !== -1) {',
          '    out.push(\'<!--xd-switch:2-->\');',
          '    case0_2.call(this, out, context);',
          '  } else {',
          '    out.push(\'<!--xd-switch:0-->\');',
          '    default0.call(this, out, context);',
          '  }',
          '}'
        ].join('\n')
      },
      CLOSE
    ]);
    expect(context.constantDeclarations).toEqual(['const case0_1$values = [\'a\', \'b\'];', 'const case0_2$values = [1];']);
    expect([...functionsToProcess!.keys()]).toEqual(['default0', 'case0_1', 'case0_2']);
  });

  it('always renders a @default declared alone', () => {
    expect(generate('@switch (kind()) { @default { d } }').pieces).toEqual([
      { statement: '{\n  const __value = this.kind();\n  out.push(\'<!--xd-switch:0-->\');\n  default0.call(this, out, context);\n}' },
      CLOSE
    ]);
  });

  it('only evaluates the expression of a @switch without blocks, writing the markers of no block', () => {
    expect(generate('@switch (kind()) { }').pieces).toEqual([{ statement: '{\n  const __value = this.kind();\n  out.push(\'<!--xd-switch-->\');\n}' }, CLOSE]);
  });

  it('writes the markers of no block without a @default when no @case matches', () => {
    expect(generate('@switch (kind()) { @case (1) { one } }').pieces).toEqual([
      {
        statement: [
          '{',
          '  const __value = this.kind();',
          '  if (case0_0$values.indexOf(__value) !== -1) {',
          '    out.push(\'<!--xd-switch:0-->\');',
          '    case0_0.call(this, out, context);',
          '  } else {',
          '    out.push(\'<!--xd-switch-->\');',
          '  }',
          '}'
        ].join('\n')
      },
      CLOSE
    ]);
  });

  it('writes no closing marker for the last node of its parent, whose blocks end where the parent does', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('kind');
    const { pieces, functionsToProcess } = generateServerSwitch(parseTemplate('@switch (kind()) { @case (1) { one } @default { d } }')[0] as SwitchNode, { id: 'td0', tag: 'td', end: true }, '0', context, undefined, true);

    expect(pieces).toHaveLength(1);
    expect(pieces).not.toContainEqual(CLOSE);
    expect(functionsToProcess!.get('td0__case0_0')!.fn.parent).toEqual({ id: 'td0__case0_0', tag: 'td', end: true });
    expect(functionsToProcess!.get('td0__default0')!.fn.parent).toEqual({ id: 'td0__default0', tag: 'td', end: true });
  });
});
