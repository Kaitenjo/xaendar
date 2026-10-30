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

describe('generateServerSwitch', () => {
  it('renders the first @case one of whose values matches, or else the @default wherever it is declared', () => {
    const { pieces, functionsToProcess } = generate('@switch (kind()) { @default { d } @case (\'a\', \'b\') { ab } @case (1) { one } }');

    expect(pieces).toEqual([{
      statement: [
        '{',
        '  const __value = this.kind();',
        '  if ([\'a\', \'b\'].some(candidate => candidate === __value)) {',
        '    case0_1.call(this, out, context);',
        '  } else if ([1].some(candidate => candidate === __value)) {',
        '    case0_2.call(this, out, context);',
        '  } else {',
        '    default0.call(this, out, context);',
        '  }',
        '}'
      ].join('\n')
    }]);
    expect([...functionsToProcess!.keys()]).toEqual(['default0', 'case0_1', 'case0_2']);
  });

  it('always renders a @default declared alone', () => {
    expect(generate('@switch (kind()) { @default { d } }').pieces).toEqual([{
      statement: '{\n  const __value = this.kind();\n  default0.call(this, out, context);\n}'
    }]);
  });

  it('only evaluates the expression of a @switch without blocks', () => {
    expect(generate('@switch (kind()) { }').pieces).toEqual([{ statement: '{\n  const __value = this.kind();\n}' }]);
  });

  it('renders nothing without a @default when no @case matches', () => {
    expect(generate('@switch (kind()) { @case (1) { one } }').pieces).toEqual([{
      statement: [
        '{',
        '  const __value = this.kind();',
        '  if ([1].some(candidate => candidate === __value)) {',
        '    case0_0.call(this, out, context);',
        '  }',
        '}'
      ].join('\n')
    }]);
  });
});
