import { ASTNodeType, parseTemplate, TemplateError, type ASTNode, type ComponentMetadata, type SymbolImport, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { ServerGenerator } from './server-generator';

const cache = {} as ContextCache;

/**
 * Generates the server code of a template.
 */
const generate = (source: string, signals: string[] = [], shadowingMembers?: string[], customElements?: string[], symbols?: SymbolImport[]) => new ServerGenerator(source, parseTemplate(source), cache).generate(signals, shadowingMembers, customElements, symbols);

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
      'import { _escapeAttribute, _escapeRawText, _escapeText, _ssrClientComponent, _ssrComponent, _ssrIsland, _ssrItemMarker, _ssrItems, _ssrRenderTemplate, _ssrStartTag, _ssrStructural, _ssrTemplate, _ssrTry } from \'@xaendar/ssr\';',
      'function render(out) {',
      '  const context = new _Context({ get: () => undefined });',
      '  out.push(\'<p><!---->\' + _escapeText(this.title()) + \'</p>\');',
      '}'
    ].join('\n'));
  });

  it('writes the components rendering only in the browser through _ssrClientComponent, in the blocks too, with the names of their inputs', () => {
    const source = '<x-map center="{ here }"></x-map>@if (open) { <x-map></x-map> }<x-card></x-card>';
    const metadata = { selector: 'x-map', clientOnly: { hydrate: 'idle' }, properties: new Map([['center', { name: 'centre', exposed: false }], ['hint', { name: 'tip', exposed: true }]]) } as unknown as ComponentMetadata;
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], [], [], [], new Set(['x-map']), [metadata]);

    expect(code.match(/_ssrClientComponent\(out/g)).toHaveLength(2);
    expect(code.match(/_ssrComponent\(out/g)).toHaveLength(1);
    expect(code).toContain('{"inputs":{"center":"centre","hint":"hint"},"island":true,"hydrate":"idle"});');
  });

  it('tells _ssrClientComponent a component is not an island and has no trigger', () => {
    const source = '<x-map></x-map>';
    const metadata = { selector: 'x-map', clientOnly: {}, properties: new Map() } as unknown as ComponentMetadata;
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], [], [], [], undefined, [metadata]);

    expect(code).toContain('{"inputs":{},"island":false});');
  });

  it('writes the events of the template for the event contract, once each, the ones of the blocks and of the conditional bindings included', () => {
    const source = '<button (click)="a()"></button>@if (open) { <i (click)="b()" (focus)="c()"></i> }<p @if (on) { (keydown)="d()" }></p>';
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], []);

    expect(code).toContain('render.events = ["click","keydown","focus"];');
  });

  it('writes no events for a template without listeners', () => {
    const source = '<p></p>';

    expect(new ServerGenerator(source, parseTemplate(source), cache).generate([], [])).not.toContain('render.events');
  });

  it('marks what listens to submit, as HTML or through the runtime', () => {
    const source = '<form (submit)="a()"></form><form [class.on]="{on}" (submit)="b()"></form><form></form>';
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], []);

    expect(code).toContain('<form data-xd-submit="">');
    expect(code).toContain('{ name: \'data-xd-submit\', value: \'\', setter: _setProperty },');
    expect(code.match(/data-xd-submit/g)).toHaveLength(2);
  });

  it('marks a form when the branch of a conditional binding listens to submit, in that branch only', () => {
    const source = '<form @if (on) { (submit)="a()" } @else { (reset)="b()" }></form>';
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], []);

    expect(code).toContain('_ssrStartTag(');
    expect(code.match(/data-xd-submit/g)).toHaveLength(1);
  });

  it('writes the interactive components a static template renders through _ssrIsland, in the blocks too', () => {
    const source = '<x-card></x-card><x-counter></x-counter>@if (open) { <x-counter></x-counter> }';
    const code = new ServerGenerator(source, parseTemplate(source), cache).generate([], [], [], [], new Set(['x-counter']));

    expect(code.match(/_ssrIsland\(out/g)).toHaveLength(2);
    expect(code.match(/_ssrComponent\(out/g)).toHaveLength(1);
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
      '    out.push(\'<!--xd-if:0-->\');',
      '    if2.call(this, out, context);',
      '  } else {',
      '    out.push(\'<!--xd-if-->\');',
      '  }',
      '  out.push(\'<!--/xd-if-->\');',
      '}'
    ].join('\n'));
    expect(code).toContain([
      `function ${key}(out, parentContext, params) {`,
      '  const context = new _Context(parentContext);',
      '  context.addIdentifier(\'item\', params[0]);',
      '  out.push(\'<b><!---->\' + _escapeText(context.get(\'item\')()) + \'</b>\');',
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
    expect(code).toContain('_escapeText(__import_format(1)) + \'<!----> <!---->\' + _escapeText(__import_count())');
  });

  it('writes a marker before each interpolation, and before a text or a @render following a text, an interpolation or a @render, across the nodes writing nothing', () => {
    const code = generate('<template t()>t</template>a{ x() }b@let n = 1;c<i></i>d@render t()e', ['x']);

    expect(code).toContain([
      '  out.push(\'a<!---->\' + _escapeText(this.x()) + \'<!---->b\');',
      '  context.set(\'n\', 1);',
      '  out.push(\'<!---->c<i></i>d<!---->\');',
      '  _ssrRenderTemplate(out, context, context.get(\'t\'), []);',
      '  out.push(\'<!---->e\');'
    ].join('\n'));
  });

  it('writes no marker in the elements whose content the parser reads as text, but writes them in the foreign elements', () => {
    const code = generate('<textarea>a{ x }</textarea><title>{ x }</title><style>{ x }</style><svg><style>{ x }</style></svg>');

    expect(code).toContain('\'<textarea>\\na\' + _escapeText(this.x) + \'</textarea><title>\' + _escapeText(this.x) + \'</title><style>\' + _escapeRawText(this.x, \'style\') + \'</style><svg><style><!---->\' + _escapeText(this.x) + \'</style></svg>\'');
  });

  it('throws a template error naming the server generator when the code of a node cannot be generated', () => {
    expect(() => generate('@render missing()')).toThrow(TemplateError);
    expect(() => generate('@render missing()')).toThrow('[Server generator] "missing" is not a template visible here');
  });

  it('throws when a node has no state', () => {
    const node = { type: ASTNodeType.Attribute, span: { start: 0, end: 1 } } as unknown as ASTNode;

    expect(() => new ServerGenerator('x', [node], cache).generate([])).toThrow('[Server generator] No transition function for ASTNode of type Attribute');
  });

  it('throws when a symbol is imported under a reserved name', () => {
    expect(() => generate('<p></p>', [], [], [], [symbol('root')])).toThrow('"root" is reserved in templates');
  });
});
