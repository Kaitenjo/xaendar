import { describe, expect, it, vi } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { TemplateFunctionFactory } from '../../types/template-function-factory.type';
import { declareScope, declareTemplateParameters } from './scope-generation.utils';

/**
 * Describes the function of a template as the tests check it: only its node and its name.
 */
const toTemplateFunction = vi.fn<TemplateFunctionFactory>((template, key, _namespace, compilerContext) => ({
  fn: { node: template, parentNode: key, context: compilerContext },
  args: ['out']
}));

describe('declareScope', () => {
  it('declares the element refs, the templates and the @let of the scope, the @let last, and writes the templates with the given factory', () => {
    const source = '@let total = count();<input #field /><template row(item: string)><b>{ item() }</b></template>';
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const key = `template_row_${source.indexOf('<template')}`;

    const declarations = declareScope(parseTemplate(source), context, toTemplateFunction, '_ssrTemplate');

    expect(declarations?.code).toEqual([
      'context.declare(\'field\');',
      `context.addIdentifier('row', _ssrTemplate(context, ${key}.bind(this)));`,
      'context.declare(\'total\', \'let\');'
    ]);
    expect([...declarations!.functionsToProcess.keys()]).toEqual([key]);
    expect(toTemplateFunction).toHaveBeenCalledWith(expect.objectContaining({ type: ASTNodeType.Template }), key, 'html', context);
    expect(context.getIdentifierKind('field')).toBe('value');
    expect(context.getIdentifierKind('row')).toBe('value');
    expect(context.getTemplateNamespace('row')).toBe('html');
    expect(context.getIdentifierKind('total')).toBe('signal');
  });

  it('writes the templates with _template by default, and declares a @let reading no signal as a value', () => {
    const context = new CompilerContext();
    const declarations = declareScope(parseTemplate('<template row()>x</template>@let label = \'x\';'), context, toTemplateFunction);

    expect(declarations?.code[0]).toContain('_template(context, template_row_0.bind(this))');
    expect(context.getIdentifierKind('label')).toBe('value');
  });

  it('declares nothing for a scope without declarations', () => {
    expect(declareScope(parseTemplate('<p>{ text }</p>'), new CompilerContext(), toTemplateFunction)).toBeUndefined();
  });
});

describe('declareTemplateParameters', () => {
  /**
   * Parses a template declaring the given parameters.
   */
  const parseParameters = (parameters: string): TemplateNode => parseTemplate(`<template row(${parameters})></template>`)[0] as TemplateNode;

  it('declares the parameters as signals, giving the ones that may be left out their default value', () => {
    const parent = new CompilerContext();
    parent.addSignalClassField('suffix');
    const context = new CompilerContext(parent);

    const lines = declareTemplateParameters(parseParameters('item: Item, label = item().name + suffix(), count?: number'), context);

    expect(lines).toEqual([
      'context.addIdentifier(\'item\', params[0]);',
      'context.addIdentifier(\'label\', _parameter(params, 1, () => context.get(\'item\')().name + this.suffix()));',
      'context.addIdentifier(\'count\', _parameter(params, 2));'
    ]);
    expect(context.getIdentifierKind('label')).toBe('signal');
  });

  it('resolves the default values with the given options', () => {
    const lines = declareTemplateParameters(parseParameters('width = innerWidth'), new CompilerContext(), { browserGlobals: 'globalThis' });

    expect(lines).toEqual(['context.addIdentifier(\'width\', _parameter(params, 0, () => globalThis.innerWidth));']);
  });
});
