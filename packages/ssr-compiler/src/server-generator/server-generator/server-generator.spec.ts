import { ASTNodeType, parseTemplate, TemplateError, type ASTNode, type SymbolImport } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { ServerGenerator } from './server-generator';

/**
 * Generates the server code of a template.
 */
const generate = (source: string, signals: string[] = [], shadowingMembers?: string[], customElements?: string[], symbols?: SymbolImport[]) => new ServerGenerator(source, parseTemplate(source)).generate(signals, shadowingMembers, customElements, symbols);

/**
 * A symbol a template imports, as `resolveTemplateImports` resolves it.
 */
const symbol = (local: string, reactive = false): SymbolImport => ({
  type: 'symbol',
  imported: local,
  local,
  modulePath: '/src/utils.ts',
  reactive,
  importedSpan: { start: 0, end: 0 },
  localSpan: { start: 0, end: 0 }
});

describe('ServerGenerator', () => {
  it('writes the imports of the runtime helpers, then render creating the root context and writing the template', () => {
    expect(generate('<p>{ title() }</p>', ['title'])).toBe([
      'import { _Context, _iterationVariables, _let, _parameter, _setExpressionClass, _setExpressionProperty, _setProperty } from \'@xaendar/core\';',
      'import { _escapeAttribute, _escapeRawText, _escapeText, _ssrComponent, _ssrItems, _ssrRenderTemplate, _ssrStartTag, _ssrStructural, _ssrTemplate } from \'@xaendar/ssr\';',
      'function render(out) {',
      '  const context = new _Context({ get: () => undefined });',
      '  out.push(\'<p>\' + _escapeText(this.title()) + \'</p>\');',
      '}'
    ].join('\n'));
  });

  it('declares the element refs, the templates and the @let of each scope, and writes the functions it calls after render', () => {
    const source = '<input #field /><template row(item: string)><b>{ item() }</b></template>@if (visible) { @let n = 1; @for (user of users(); track user()) { @render row(user()) } }';
    const code = generate(source, ['users']);
    const key = `template_row_${source.indexOf('<template')}`;

    expect(code).toContain([
      'function render(out) {',
      '  const context = new _Context({ get: () => undefined });',
      '  context.declare(\'field\');',
      `  context.addIdentifier('row', _ssrTemplate(context, ${key}.bind(this)));`,
      '  context.set(\'field\', undefined);',
      '  out.push(\'<input>\');',
      '  if (this.visible) {',
      '    if2.call(this, out, context);',
      '  }',
      '}'
    ].join('\n'));
    expect(code).toContain([
      `function ${key}(out, parentContext, params) {`,
      '  const context = new _Context(parentContext);',
      '  context.addIdentifier(\'item\', params[0]);',
      '  out.push(\'<b>\' + _escapeText(context.get(\'item\')()) + \'</b>\');',
      '}'
    ].join('\n'));
    expect(code).toContain([
      'function if2(out, parentContext) {',
      '  const context = new _Context(parentContext);',
      '  context.declare(\'n\', \'let\');',
      '  context.set(\'n\', 1);',
      '  {'
    ].join('\n'));
    expect(code).toContain([
      'function if2__for1(out, parentContext, items, index) {',
      '  const context = new _Context(parentContext);',
      '  _iterationVariables(context, items, index, \'user\', { $index: \'$index\', $first: \'$first\', $last: \'$last\', $even: \'$even\', $odd: \'$odd\' });',
      '  _ssrRenderTemplate(out, context, context.get(\'row\'), [() => context.get(\'user\')()]);',
      '}'
    ].join('\n'));
  });

  it('declares the scope of the content of an element a structural directive is applied to, and not the one of any other element', () => {
    const code = generate('<div *guard><input #inner /></div><p><input #outer /></p>');

    expect(code).toContain('function div0Children(out, parentContext) {\n  const context = new _Context(parentContext);\n  context.declare(\'inner\');');
    expect(code).toContain('  context.declare(\'outer\');\n  _ssrStructural(');
  });

  it('reads the members shadowing a global from the component, and writes the custom elements of other libraries like native ones', () => {
    const code = generate('<sl-icon name="{ name }"></sl-icon>', [], ['name'], ['sl-*']);

    expect(code).toContain('out.push(\'<sl-icon name="\' + _escapeAttribute(this.name) + \'"></sl-icon>\');');
  });

  it('imports the symbols an expression reads, after the runtime helpers, and reads them through their alias', () => {
    const code = generate('<p>{ format(1) } { count() }</p>', [], [], [], [symbol('format'), symbol('count', true), symbol('unused')]);
    const lines = code.split('\n');

    expect(lines.slice(2, 4)).toEqual([
      'import { format as __import_format } from \'/src/utils.ts\';',
      'import { count as __import_count } from \'/src/utils.ts\';'
    ]);
    expect(code).not.toContain('__import_unused');
    expect(code).toContain('_escapeText(__import_format(1)) + \' \' + _escapeText(__import_count())');
  });

  it('throws a template error naming the server generator when the code of a node cannot be generated', () => {
    expect(() => generate('@render missing()')).toThrow(TemplateError);
    expect(() => generate('@render missing()')).toThrow('[Server generator] "missing" is not a template visible here');
  });

  it('throws when a node has no state', () => {
    const node = { type: ASTNodeType.Attribute, span: { start: 0, end: 1 } } as unknown as ASTNode;

    expect(() => new ServerGenerator('x', [node]).generate([])).toThrow('[Server generator] No transition function for ASTNode of type Attribute');
  });

  it('throws when a symbol is imported under a reserved name', () => {
    expect(() => generate('<p></p>', [], [], [], [symbol('root')])).toThrow('"root" is reserved in templates');
  });
});
