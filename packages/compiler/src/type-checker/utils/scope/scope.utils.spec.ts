import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { typeCheckElement } from '../../states/type-check-element/type-check-element.state';
import { typeCheckTextAndInterpolation } from '../../states/type-check-text-and-interpolation/type-check-text-and-interpolation.state';
import type { ProcessNode } from '../../types/type-checker-process-node.type';
import { getInstantiationSuffix, typeCheckScope } from './scope.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * Type-checks the elements, the texts and the interpolations of a template.
 */
const processNode: ProcessNode = (node, context) => (node.type === ASTNodeType.Element ? typeCheckElement(node, processNode, context) : typeCheckTextAndInterpolation(node as never, processNode, context));

/**
 * A component, generic when it declares type parameters.
 */
const component = (typeParameters?: string[]) => ({
  type: 'component',
  className: 'MyEl',
  selector: 'my-el',
  properties: new Map(),
  events: new Map(),
  typeParameters: typeParameters?.map(name => ({ name, hasDefault: true })),
  typescriptNodes: {
    klass: {
      name: { text: 'MyEl' },
      typeParameters: typeParameters?.map(name => ({ name: { text: name } })),
      getSourceFile: () => ({ fileName: '/src/my.xd.component.ts' })
    }
  }
}) as unknown as ComponentMetadata;

const text = (lines: Array<{ text: string }>) => lines.map(({ text: lineText }) => lineText);

describe('typeCheckScope', () => {
  it('declares the template variables of the scope, however deeply nested, which the expressions of the whole scope read as written', () => {
    const template = '<p>{ field.value }</p><label><input #field /></label>';
    const { declarations, lines } = typeCheckScope(parse(template), new TypeCheckContext(), processNode);

    expect(text(declarations)).toEqual(['let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);']);
    // The declaration is mapped onto the name, where the definition of a read of the variable leads
    expect(declarations[0].mappings).toEqual([{ columnStart: 4, columnEnd: 9, original: { start: template.indexOf('field />'), end: template.indexOf('field />') + 5 } }]);
    expect(text(lines)).toEqual(['field.value;']);
  });

  it('types an element through the tag name map of its namespace', () => {
    const { declarations } = typeCheckScope(parse('<svg #chart><circle #dot /></svg><mi #symbol />'), new TypeCheckContext(new TypeCheckContext(), 'mathml'), processNode);

    expect(text(declarations)).toEqual([
      'let chart!: (SVGElementTagNameMap extends { \'svg\': infer Type } ? Type : SVGElement);',
      'let dot!: (SVGElementTagNameMap extends { \'circle\': infer Type } ? Type : SVGElement);',
      'let symbol!: (MathMLElementTagNameMap extends { \'mi\': infer Type } ? Type : MathMLElement);'
    ]);
  });

  it('types a component through its class', () => {
    const context = new TypeCheckContext();
    context.addImport(component());

    expect(text(typeCheckScope(parse('<my-el #card></my-el>'), context, processNode).declarations)).toEqual(['let card!: import(\'/src/my.xd.component\').MyEl;']);
  });

  it('types a generic component through its instantiation, declared by the element, or as any when the element failed type-checking', () => {
    const context = new TypeCheckContext();
    context.addImport(component(['Item']));

    expect(text(typeCheckScope(parse('<my-el #list></my-el>'), context, processNode).declarations)).toEqual(['let list!: __Instance0;']);
    expect(text(typeCheckScope(parse('<my-el #list></my-el>'), new TypeCheckContext(context), () => []).declarations)).toEqual(['let list!: __Instance0;']);
    expect(text(typeCheckScope(parse('<b></b><my-el #list></my-el>'), new TypeCheckContext(context), () => []).declarations)).toEqual(['let list!: any;']);
  });

  it('registers a name declared twice once, declaring it twice so that TypeScript reports both declarations', () => {
    const context = new TypeCheckContext();
    const { declarations } = typeCheckScope(parse('<input #field /><select #field />'), context, processNode);

    expect(text(declarations)).toEqual([
      'let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      'let field!: (HTMLElementTagNameMap extends { \'select\': infer Type } ? Type : HTMLElement);'
    ]);
    expect(context.declaresIdentifier('field')).toBe(true);
  });

  it('leaves a name the scope already declares, e.g. an item of a @for, as it is registered', () => {
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('item', 'signal');

    expect(text(typeCheckScope(parse('<input #item />'), context, processNode).declarations)).toHaveLength(1);
    expect(context.getUnresolvableIdentifierKind('item')).toBe('signal');
  });

  it('declares the templates of the scope, however deeply nested, with the types of their parameters mapped onto the template', () => {
    const template = '<div><template #row(item: Item, index: number) /></div><svg><template #empty() /></svg>';
    const context = new TypeCheckContext();
    const skipTemplates: ProcessNode = (node, nodeContext) => (node.type === ASTNodeType.Template ? [] : processNode(node, nodeContext));
    const { declarations } = typeCheckScope(parse(template), context, skipTemplates);
    const row = template.indexOf('<template');
    const empty = template.lastIndexOf('<template');

    expect(text(declarations)).toEqual([
      `type __Params${row} = [item: Item, index: number];`,
      `let row!: __Template<__Params${row}>;`,
      `type __Params${empty} = [];`,
      `let empty!: __Template<__Params${empty}>;`
    ]);
    const at = (name: string) => ({ start: template.indexOf(name), end: template.indexOf(name) + name.length });
    expect(declarations[0].mappings).toEqual([
      { columnStart: `type __Params${row} = [item: `.length, columnEnd: `type __Params${row} = [item: Item`.length, original: at('Item') },
      { columnStart: `type __Params${row} = [item: Item, index: `.length, columnEnd: `type __Params${row} = [item: Item, index: number`.length, original: at('number') }
    ]);
    expect(declarations[1].mappings).toEqual([{ columnStart: 4, columnEnd: 7, original: at('row') }]);
    expect(context.getTemplateNamespace('row')).toBe('html');
    expect(context.getTemplateNamespace('empty')).toBe('svg');
  });
});

describe('getInstantiationSuffix', () => {
  it('tells the declarations of an element apart by its position', () => {
    expect(getInstantiationSuffix({ span: { start: 42, end: 60 } })).toBe('42');
  });
});
