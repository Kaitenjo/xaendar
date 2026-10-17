import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckTemplate } from './type-check-template.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TemplateNode;

describe('typeCheckTemplate', () => {
  it('checks the content in an arrow function taking the signals of the parameters, mapped onto their names', () => {
    const template = '<template #row(item: Item, index: number)><p /></template>';
    const contexts = new Array<TypeCheckContext>();
    const processNode: ProcessNode = (_node, context) => {
      contexts.push(context);
      return [{ text: 'child;' }];
    };
    const context = new TypeCheckContext();
    const lines = typeCheckTemplate(parse(template), processNode, context);

    expect(lines.map(({ text }) => text)).toEqual([
      '((...[item, index]: __Parameters<__Params0>) => {',
      '  child;',
      '});'
    ]);
    const at = (name: string) => ({ start: template.indexOf(name), end: template.indexOf(name) + name.length });
    expect(lines[0].mappings).toEqual([
      { columnStart: 6, columnEnd: 10, original: at('item') },
      { columnStart: 12, columnEnd: 17, original: at('index') }
    ]);
    // The content reads the parameters as written, as signals, in a scope nested in the one declaring the template
    const [contentContext] = contexts;
    expect(contentContext).not.toBe(context);
    expect(contentContext.getUnresolvableIdentifierKind('item')).toBe('signal');
    expect(context.hasUnresolvableIdentifier('item')).toBe(false);
  });

  it('checks the content of a template without parameters in an arrow function without parameters, declaring the names of its scope', () => {
    const lines = typeCheckTemplate(parse('<template #row()><input #field /></template>'), () => [], new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      '(() => {',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '});'
    ]);
  });
});
