import { describe, expect, it, vi } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { GeneratorContext } from '../../context/context';
import type { TemplateFunctionFactory } from '../../types/template-function-factory.type';
import { createScope, declareScope, declareTemplateParameters } from './scope-generation.utils';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

/**
 * Describes the function of a template as the tests check it: its node, its name, and the scope of its content,
 * declaring its parameters.
 */
const toTemplateFunction = vi.fn<TemplateFunctionFactory>((template, key, _namespace, generatorContext) => {
  const context = new GeneratorContext(generatorContext);
  for (let i = 0; i < template.parameters.length; i++) {
    context.addIdentifier(template.parameters[i].name, 'variable');
  }

  return { fn: { node: template, parentNode: key, context }, args: ['out'] };
});

describe('declareScope', () => {
  it('declares the element refs, the templates and the @let of the scope, the @let last, and writes the templates on the server as the functions rendering them, without their parameters', () => {
    const source = '@let total = count();<input #field /><template row(item: string)><b>{ item }</b></template>';
    const context = new GeneratorContext(cache);
    context.addSignalClassField('count');
    const key = `template_row_${source.indexOf('<template')}`;

    const declarations = declareScope(parseTemplate(source), context, toTemplateFunction, true);

    // The template takes no slot: the ref the first one, the @let the next
    expect(declarations?.code).toEqual([
      '_declare(context, 7);',
      '_declare(context, 8, \'let\');'
    ]);
    expect(context.variableNames).toEqual(['field', 'total']);
    expect(context.readIdentifier('row')).toBe(key);
    expect(context.constantDeclarations).toEqual([]);
    expect([...declarations!.functionsToProcess.keys()]).toEqual([key]);
    expect(toTemplateFunction).toHaveBeenCalledWith(expect.objectContaining({ type: ASTNodeType.Template }), key, 'html', context);
    expect(context.getIdentifierKind('field')).toBe('value');
    expect(context.getIdentifierKind('row')).toBe('value');
    expect(context.getTemplateNamespace('row')).toBe('html');
    expect(context.getIdentifierKind('total')).toBe('variable');
  });

  it('writes the templates by default as constants of the module naming the function rendering them and the identifiers of their parameters, and declares a literal @let as a value', () => {
    const context = new GeneratorContext(cache);
    const declarations = declareScope(parseTemplate('<template row()>x</template><template cell(item: string, index: number)>y</template>@let label = \'x\';'), context, toTemplateFunction);
    const cellKey = 'template_cell_28';

    expect(declarations?.code).toEqual(['_declare(context, 7, \'let\');']);
    expect(context.readIdentifier('cell')).toBe(`${cellKey}$template`);
    // The @let takes the identifier 0, the parameters of the cell the next ones
    expect(context.constantDeclarations).toEqual([
      'const template_row_0$template = { render: template_row_0, parameters: [] };',
      `const ${cellKey}$template = { render: ${cellKey}, parameters: [1, 2] };`
    ]);
    expect(context.getIdentifierKind('label')).toBe('value');
  });

  it('describes the templates once every name of the scope is registered, so that their default values read the @let of the scope', () => {
    const context = new GeneratorContext(cache);
    const kinds = new Array<string | undefined>();
    const describeTemplate = vi.fn<TemplateFunctionFactory>((template, key, _namespace, generatorContext) => {
      kinds.push(generatorContext.getIdentifierKind('total'));
      return { fn: { node: template, parentNode: key, context: new GeneratorContext(generatorContext) }, args: [] };
    });

    declareScope(parseTemplate('<template row(dense: boolean = total > 1)>x</template>@let total = count();'), context, describeTemplate, true);

    expect(kinds).toEqual(['variable']);
  });

  it('returns the templates of a scope declaring nothing else', () => {
    const declarations = declareScope(parseTemplate('<template row()>x</template>'), new GeneratorContext(cache), toTemplateFunction, true);

    expect(declarations?.code).toEqual([]);
    expect([...declarations!.functionsToProcess.keys()]).toEqual(['template_row_0']);
  });

  it('declares nothing for a scope without declarations', () => {
    expect(declareScope(parseTemplate('<p>{ text }</p>'), new GeneratorContext(cache), toTemplateFunction)).toBeUndefined();
  });
});

describe('declareTemplateParameters', () => {
  /**
   * Parses a template declaring the given parameters.
   */
  const parseParameters = (parameters: string): TemplateNode => parseTemplate(`<template row(${parameters})></template>`)[0] as TemplateNode;

  it('declares the parameters as variables in the first slots, giving the ones that may be left out their default value as a @let does, with the variables it reads', () => {
    const parent = new GeneratorContext(cache);
    parent.addSignalClassField('suffix');
    const context = new GeneratorContext(parent);

    const lines = declareTemplateParameters(parseParameters('item: Item, label = item.name + suffix(), count?: number, unit = suffix()'), 'template_row_12', context);

    expect(lines).toEqual([
      'context[7] = params[0];',
      '_parameter(context, params, 1, 1, template_row_12$label, _reads0);',
      'context[9] = params[2];',
      '_parameter(context, params, 3, 3, template_row_12$unit);'
    ]);
    expect(parent.readsDeclarations).toEqual(['const _reads0 = [0];']);
    expect(parent.functionDeclarations).toEqual([
      'function template_row_12$label(context) {\n  return _read(context, 0, 7).name + this.suffix();\n}',
      'function template_row_12$unit(context) {\n  return this.suffix();\n}'
    ]);
    expect(context.getIdentifierKind('label')).toBe('variable');
  });

  it('writes the default values as expressions on the server, which reads every value once', () => {
    const context = new GeneratorContext(cache);
    const lines = declareTemplateParameters(parseParameters('item: Item, label = item.name'), 'template_row_0', context, undefined, true);

    expect(lines).toEqual([
      'context[7] = params[0];',
      'context[8] = 1 < params.length ? params[1] : (_read(context, 0, 7).name);'
    ]);
    expect(context.functionDeclarations).toEqual([]);
  });

  it('resolves the default values with the given options', () => {
    const context = new GeneratorContext(cache);
    const lines = declareTemplateParameters(parseParameters('width = innerWidth'), 'template_row_0', context, { browserGlobals: 'globalThis' });

    expect(lines).toEqual(['_parameter(context, params, 0, 0, template_row_0$width);']);
    expect(context.functionDeclarations).toEqual(['function template_row_0$width(context) {\n  return globalThis.innerWidth;\n}']);
  });
});

describe('createScope', () => {
  it('creates the scope from its layout, leaving out the strategy to inherit the one of its parent', () => {
    expect(createScope('parentContext', '_layout0', 'nodeStrategy')).toBe('_scope(parentContext, _layout0, nodeStrategy)');
    expect(createScope('parentContext', '_layout1')).toBe('_scope(parentContext, _layout1)');
  });

  it('passes the component of the root scope of a render after its strategy, whatever it is', () => {
    expect(createScope('null', '_layout0', 'nodeStrategy', 'this')).toBe('_scope(null, _layout0, nodeStrategy, this)');
    expect(createScope('null', '_layout0', 'undefined', 'this')).toBe('_scope(null, _layout0, undefined, this)');
  });
});
