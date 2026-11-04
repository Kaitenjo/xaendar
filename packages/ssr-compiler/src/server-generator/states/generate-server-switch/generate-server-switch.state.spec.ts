import { CompilerContext, parseTemplate, type SwitchNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerSwitch } from './generate-server-switch.state';

/**
 * Generates the code of a `@switch` written at the root of a template.
 */
const generate = (source: string) => {
  const context = new CompilerContext();
  context.addSignalClassField('kind');
  return generateServerSwitch(parseTemplate(source)[0] as SwitchNode, { id: 'root' }, '0', context);
};

/**
 * The piece closing the blocks of a `@switch`.
 */
const CLOSE = { html: '<!--/xd-switch-->' };

describe('generateServerSwitch', () => {
  it('renders the first @case one of whose values matches, or else the @default wherever it is declared, between the markers holding the position of the block', () => {
    const { pieces, functionsToProcess } = generate('@switch (kind()) { @default { d } @case (\'a\', \'b\') { ab } @case (1) { one } }');

    expect(pieces).toEqual([
      {
        statement: [
          '{',
          '  const __value = this.kind();',
          '  if ([\'a\', \'b\'].some(candidate => candidate === __value)) {',
          '    out.push(\'<!--xd-switch:1-->\');',
          '    case0_1.call(this, out, context);',
          '  } else if ([1].some(candidate => candidate === __value)) {',
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
          '  if ([1].some(candidate => candidate === __value)) {',
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
});
