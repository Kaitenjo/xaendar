import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckTemplate } from './type-check-template.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TemplateNode;

describe('typeCheckTemplate', () => {
  it('checks the content in an arrow function taking the signals of the parameters, mapped onto their names and types', () => {
    const template = '<template #row(item: Item, index: number)><p /></template>';
    const contexts = new Array<TypeCheckContext>();
    const processNode: ProcessNode = (_node, context) => {
      contexts.push(context);
      return [{ text: 'child;' }];
    };
    const context = new TypeCheckContext();
    const lines = typeCheckTemplate(parse(template), processNode, context);

    expect(lines.map(({ text }) => text)).toEqual([
      'const __template0 = (item: __Parameter<Item>, index: __Parameter<number>): void => {',
      '  child;',
      '};'
    ]);
    const at = (name: string) => ({ start: template.indexOf(name), end: template.indexOf(name) + name.length });
    const column = (text: string) => lines[0].text.indexOf(text);
    expect(lines[0].mappings).toEqual([
      { columnStart: column('item'), columnEnd: column('item') + 4, original: at('item') },
      { columnStart: column('Item>'), columnEnd: column('Item>') + 4, original: at('Item') },
      { columnStart: column('index'), columnEnd: column('index') + 5, original: at('index') },
      { columnStart: column('number'), columnEnd: column('number') + 6, original: at('number') }
    ]);
    // The content reads the parameters as written, as signals, in a scope nested in the one declaring the template
    const [contentContext] = contexts;
    expect(contentContext).not.toBe(context);
    expect(contentContext.getUnresolvableIdentifierKind('item')).toBe('signal');
    expect(context.hasUnresolvableIdentifier('item')).toBe(false);
  });

  it('initializes the parameters whose argument may be left out, with their default value or undefined', () => {
    const template = '<template #row(item: Item, label = item().name + suffix, dense: boolean = false, count?: number)></template>';
    const [first] = typeCheckTemplate(parse(template), () => [], new TypeCheckContext());

    expect(first.text).toBe('const __template0 = (item: __Parameter<Item>, label = __default(item().name + root.suffix), dense = __default<boolean>(false), count = __optional<number>()): void => {');
    const column = first.text.indexOf('item().name');
    const start = template.indexOf('item().name');
    expect(first.mappings).toEqual(expect.arrayContaining([
      { columnStart: column, columnEnd: column + 4, original: { start, end: start + 4 } }
    ]));
  });

  it('checks the content of a template without parameters in an arrow function without parameters, declaring the names of its scope', () => {
    const lines = typeCheckTemplate(parse('<template #row()><input #field /></template>'), () => [], new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      'const __template0 = (): void => {',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '};'
    ]);
  });
});
