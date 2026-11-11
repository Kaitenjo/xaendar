import { describe, expect, it, vi } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { GeneratorContext } from '../../context/context';
import type { TemplateFunctionFactory } from '../../types/template-function-factory.type';
import { createContext, declareScope, declareTemplateParameters } from './scope-generation.utils';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

/**
 * Describes the function of a template as the tests check it: only its node and its name.
 */
const toTemplateFunction = vi.fn<TemplateFunctionFactory>((template, key, _namespace, generatorContext) => ({
  fn: { node: template, parentNode: key, context: generatorContext },
  args: ['out']
}));

describe('declareScope', () => {
  it('declares the element refs, the templates and the @let of the scope, the @let last, and writes the templates on the server as the functions rendering them, without their parameters', () => {
    const source = '@let total = count();<input #field /><template row(item: string)><b>{ item }</b></template>';
    const context = new GeneratorContext(cache);
    context.addSignalClassField('count');
    const key = `template_row_${source.indexOf('<template')}`;

    const declarations = declareScope(parseTemplate(source), context, toTemplateFunction, true);

    expect(declarations?.code).toEqual([
      'context.declare(\'field\');',
      `context.addIdentifier('row', ${key});`,
      'context.declare(\'total\', \'let\');'
    ]);
    expect(context.constantDeclarations).toEqual([]);
    expect([...declarations!.functionsToProcess.keys()]).toEqual([key]);
    expect(toTemplateFunction).toHaveBeenCalledWith(expect.objectContaining({ type: ASTNodeType.Template }), key, 'html', context);
    expect(context.getIdentifierKind('field')).toBe('value');
    expect(context.getIdentifierKind('row')).toBe('value');
    expect(context.getTemplateNamespace('row')).toBe('html');
    expect(context.getIdentifierKind('total')).toBe('variable');
  });

  it('writes the templates by default as constants of the module naming the function rendering them and their parameters, and declares a literal @let as a value', () => {
    const context = new GeneratorContext(cache);
    const declarations = declareScope(parseTemplate('<template row()>x</template><template cell(item: string, index: number)>y</template>@let label = \'x\';'), context, toTemplateFunction);
    const cellKey = 'template_cell_28';

    expect(declarations?.code).toEqual([
      'context.addIdentifier(\'row\', template_row_0$template);',
      `context.addIdentifier('cell', ${cellKey}$template);`,
      'context.declare(\'label\', \'let\');'
    ]);
    expect(context.constantDeclarations).toEqual([
      'const template_row_0$template = { render: template_row_0, parameters: [] };',
      `const ${cellKey}$template = { render: ${cellKey}, parameters: ['item', 'index'] };`
    ]);
    expect(context.getIdentifierKind('label')).toBe('value');
  });

  it('describes the templates once every name of the scope is registered, so that their default values read the @let of the scope', () => {
    const context = new GeneratorContext(cache);
    const kinds = new Array<string | undefined>();
    const describeTemplate = vi.fn<TemplateFunctionFactory>((template, key, _namespace, generatorContext) => {
      kinds.push(generatorContext.getIdentifierKind('total'));
      return { fn: { node: template, parentNode: key, context: generatorContext }, args: [] };
    });

    declareScope(parseTemplate('<template row(dense: boolean = total > 1)>x</template>@let total = count();'), context, describeTemplate);

    expect(kinds).toEqual(['variable']);
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

  it('declares the parameters as variables, giving the ones that may be left out their default value as a @let does, with the variables it reads', () => {
    const parent = new GeneratorContext(cache);
    parent.addSignalClassField('suffix');
    const context = new GeneratorContext(parent);

    const lines = declareTemplateParameters(parseParameters('item: Item, label = item.name + suffix(), count?: number, unit = suffix()'), 'template_row_12', context);

    expect(lines).toEqual([
      'context.addIdentifier(\'item\', params[0]);',
      '_parameter(context, params, 1, \'label\', template_row_12$label, _reads0);',
      'context.addIdentifier(\'count\', params[2]);',
      '_parameter(context, params, 3, \'unit\', template_row_12$unit);'
    ]);
    expect(parent.readsDeclarations).toEqual(['const _reads0 = [\'item\'];']);
    expect(parent.functionDeclarations).toEqual([
      'function template_row_12$label(context) {\n  return context.get(\'item\').name + this.suffix();\n}',
      'function template_row_12$unit(context) {\n  return this.suffix();\n}'
    ]);
    expect(context.getIdentifierKind('label')).toBe('variable');
  });

  it('writes the default values as expressions on the server, which reads every value once', () => {
    const context = new GeneratorContext(cache);
    const lines = declareTemplateParameters(parseParameters('item: Item, label = item.name'), 'template_row_0', context, undefined, true);

    expect(lines).toEqual([
      'context.addIdentifier(\'item\', params[0]);',
      'context.addIdentifier(\'label\', 1 < params.length ? params[1] : (context.get(\'item\').name));'
    ]);
    expect(context.functionDeclarations).toEqual([]);
  });

  it('resolves the default values with the given options', () => {
    const context = new GeneratorContext(cache);
    const lines = declareTemplateParameters(parseParameters('width = innerWidth'), 'template_row_0', context, { browserGlobals: 'globalThis' });

    expect(lines).toEqual(['_parameter(context, params, 0, \'width\', template_row_0$width);']);
    expect(context.functionDeclarations).toEqual(['function template_row_0$width(context) {\n  return globalThis.innerWidth;\n}']);
  });
});

describe('createContext', () => {
  it('creates the context for the variables of its scope, leaving out what the runtime defaults', () => {
    expect(createContext('parentContext', 'nodeStrategy', 3)).toBe('new _Context(parentContext, nodeStrategy, 3)');
    expect(createContext('parentContext', undefined, 2)).toBe('new _Context(parentContext, undefined, 2)');
    expect(createContext('parentContext', 'nodeStrategy', 0)).toBe('new _Context(parentContext, nodeStrategy)');
    expect(createContext('parentContext', undefined, 0)).toBe('new _Context(parentContext)');
  });

  it('passes the component of the root context of a render after the number of its variables, whatever their number', () => {
    expect(createContext('_ROOT_PARENT_CONTEXT', 'nodeStrategy', 1, 'this')).toBe('new _Context(_ROOT_PARENT_CONTEXT, nodeStrategy, 1, this)');
    expect(createContext('_ROOT_PARENT_CONTEXT', undefined, 0, 'this')).toBe('new _Context(_ROOT_PARENT_CONTEXT, undefined, 0, this)');
  });
});
