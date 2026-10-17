import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import { type IGrammar, type IRawGrammar, INITIAL, parseRawGrammar, Registry, type StateStack } from 'vscode-textmate';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A minimal HTML grammar standing for the one of VS Code: tags, attributes and comments.
 */
const HTML_GRAMMAR = {
  scopeName: 'text.html.basic',
  patterns: [{ include: '#comment' }, { include: '#tag-close' }, { include: '#tag' }],
  repository: {
    comment: { begin: '<!--', end: '-->', name: 'comment.block.html' },
    'tag-close': {
      match: '(</)([a-zA-Z][\\w-]*)(>)',
      captures: { 2: { name: 'entity.name.tag.html' } }
    },
    tag: {
      begin: '(<)([a-zA-Z][\\w-]*)',
      beginCaptures: { 2: { name: 'entity.name.tag.html' } },
      end: '/?>',
      name: 'meta.tag.html',
      patterns: [{ include: '#attribute' }]
    },
    attribute: {
      patterns: [{
        begin: '([^\\s"\'<>/=]+)',
        beginCaptures: { 1: { name: 'entity.other.attribute-name.html' } },
        end: '(?=\\s*+[^=\\s])',
        patterns: [
          { match: '=', name: 'punctuation.separator.key-value.html' },
          { begin: '"', end: '"', name: 'string.quoted.double.html' }
        ]
      }]
    }
  }
};

/**
 * A minimal TypeScript grammar standing for the one of VS Code: its `expression` rule only.
 */
const TYPESCRIPT_GRAMMAR = {
  scopeName: 'source.ts',
  patterns: [{ include: '#expression' }],
  repository: {
    type: {
      patterns: [
        { match: '\\b(?:string|number|boolean)\\b', name: 'support.type.primitive.ts' },
        { match: '[A-Z][\\w$]*', name: 'entity.name.type.ts' }
      ]
    },
    expression: {
      patterns: [
        { match: '\'[^\']*\'', name: 'string.quoted.single.ts' },
        { match: '\\b\\d+\\b', name: 'constant.numeric.decimal.ts' },
        { match: '[A-Za-z_$][\\w$]*(?=\\s*\\()', name: 'entity.name.function.ts' },
        { match: '[A-Za-z_$][\\w$]*', name: 'variable.other.readwrite.ts' }
      ]
    }
  }
};

let grammar: IGrammar;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const wasm = readFileSync(join(require.resolve('vscode-oniguruma'), '..', 'onig.wasm'));
  await loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer);

  const grammars: Record<string, IRawGrammar> = {
    'text.html.basic': parseRawGrammar(JSON.stringify(HTML_GRAMMAR), 'html.json'),
    'source.ts': parseRawGrammar(JSON.stringify(TYPESCRIPT_GRAMMAR), 'typescript.json'),
    'xaendar.template.injection': parseRawGrammar(readFileSync(join(import.meta.dirname, 'xaendar-template.tmLanguage.json'), 'utf-8'), 'xaendar-template.tmLanguage.json')
  };
  const registry = new Registry({
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
    loadGrammar: async scopeName => grammars[scopeName],
    getInjections: scopeName => scopeName === 'text.html.basic' ? ['xaendar.template.injection'] : undefined
  });

  grammar = (await registry.loadGrammar('text.html.basic'))!;
});

/**
 * Tokenizes a template and returns the scopes of the token holding the nth occurrence of a text.
 */
function scopesOf(template: string, text: string, occurrence = 0): string[] {
  let offset = -1;
  for (let i = 0; i <= occurrence; i++) {
    offset = template.indexOf(text, offset + 1);
  }

  let state: StateStack = INITIAL;
  let lineStart = 0;
  for (const line of template.split('\n')) {
    const { tokens, ruleStack } = grammar.tokenizeLine(line, state);
    state = ruleStack;
    const token = tokens.find(({ startIndex, endIndex }) => offset >= lineStart + startIndex && offset < lineStart + endIndex);
    if (token) {
      return token.scopes;
    }

    lineStart += line.length + 1;
  }

  throw new Error(`"${text}" not found`);
}

describe('xaendar-template grammar', () => {
  it('colors the @import statements, also spanning several lines', () => {
    const template = '@import { Child, Card as C, default as D, * as all } from \'./child\';\n@import {\n  Tooltip\n} from "./directives"\n<p></p>';

    expect(scopesOf(template, '@import')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, 'Child')).toContain('meta.import.specifier.xaendar');
    expect(scopesOf(template, 'as')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, 'C,')).toContain('meta.import.specifier.xaendar');
    expect(scopesOf(template, 'default')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, '*')).toContain('keyword.operator.wildcard.xaendar');
    expect(scopesOf(template, 'from')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, './child')).toContain('string.quoted.xaendar');
    expect(scopesOf(template, ';')).toContain('punctuation.terminator.statement.xaendar');
    expect(scopesOf(template, 'Tooltip')).toContain('meta.import.specifier.xaendar');
    expect(scopesOf(template, './directives')).toContain('string.quoted.xaendar');
    // The statement ends with its path
    expect(scopesOf(template, 'p>')).toContain('entity.name.tag.html');
  });

  it('colors the tags with a dash as the native ones, in the opening and in the closing tag', () => {
    const template = '<my-child label="a"></my-child><div></div>';

    expect(scopesOf(template, 'my-child')).toContain('entity.name.tag.html');
    expect(scopesOf(template, 'my-child', 1)).toContain('entity.name.tag.html');
    expect(scopesOf(template, 'label')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, 'div')).toContain('entity.name.tag.html');
  });

  it('colors the event bindings, their handler and arguments as expressions', () => {
    const template = '<button (click)="save(item, $event)"></button>';

    expect(scopesOf(template, 'click')).toContain('entity.name.function.event.xaendar');
    expect(scopesOf(template, 'save')).toEqual(expect.arrayContaining(['meta.embedded.expression.xaendar', 'entity.name.function.ts']));
    expect(scopesOf(template, 'item')).toContain('variable.other.readwrite.ts');
    expect(scopesOf(template, '$event')).toContain('variable.language.xaendar');
  });

  it('colors the directives and structural directives, with their bindings', () => {
    const template = '<div @@tooltip(text="{ label }" (shown)="log()" disabled) *media(query="q") @@plain></div>';

    expect(scopesOf(template, '@@')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'tooltip')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'text')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, 'label')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, 'shown')).toContain('entity.name.function.event.xaendar');
    expect(scopesOf(template, 'disabled')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, '*')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'media')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'q"')).toContain('string.quoted.double.html');
    expect(scopesOf(template, 'plain')).toContain('keyword.control.directive.xaendar');
    // A multiplication is not a structural directive
    expect(scopesOf('{ 2*size(1) }', 'size')).not.toContain('keyword.control.directive.xaendar');
  });

  it('colors the type arguments of a directive as types, and keeps coloring its bindings', () => {
    const template = '<div @@list<string, Map<Item, number>>(items="{ rows }" (picked)="log()") *each<Item>(of="{ rows }") @@bare<string>></div>';

    expect(scopesOf(template, 'list')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'string,')).toContain('support.type.primitive.ts');
    expect(scopesOf(template, 'Map')).toContain('entity.name.type.ts');
    expect(scopesOf(template, 'Item, number')).toContain('meta.type.parameters.xaendar');
    expect(scopesOf(template, '<string')).toContain('punctuation.definition.typeparameters.begin.xaendar');
    expect(scopesOf(template, 'items')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, 'rows')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, 'picked')).toContain('entity.name.function.event.xaendar');
    expect(scopesOf(template, 'each')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'Item>(')).toContain('entity.name.type.ts');
    expect(scopesOf(template, 'bare')).toContain('keyword.control.directive.xaendar');
    expect(scopesOf(template, 'string>>')).toContain('support.type.primitive.ts');
  });

  it('colors the type arguments of a web component as types, and keeps coloring its bindings', () => {
    const template = '<ex-list(string, Map<Item, (value: number) => void>) items="{ rows }" (picked)="log()"></ex-list><ex-bare(Item)/>';

    expect(scopesOf(template, 'ex-list')).toContain('entity.name.tag.html');
    expect(scopesOf(template, '(string')).toContain('punctuation.definition.typeparameters.begin.xaendar');
    expect(scopesOf(template, 'string,')).toContain('support.type.primitive.ts');
    expect(scopesOf(template, 'Map')).toContain('entity.name.type.ts');
    expect(scopesOf(template, 'number)')).toContain('meta.type.parameters.xaendar');
    expect(scopesOf(template, ') items')).toContain('punctuation.definition.typeparameters.end.xaendar');
    expect(scopesOf(template, 'items')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, 'rows')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, 'picked')).toContain('entity.name.function.event.xaendar');
    expect(scopesOf(template, 'ex-bare')).toContain('entity.name.tag.html');
    expect(scopesOf(template, 'Item)/')).toContain('entity.name.type.ts');
  });

  it('colors the template variables, and the declaration of a template with its parameters, leaving the # of the values alone', () => {
    const template = '<input #field type="text" /><p data-color="#fde68a" href="#top">Issue #42</p><template #row(item: Item, index: number)></template>';

    expect(scopesOf(template, '#field')).toContain('punctuation.definition.template-variable.xaendar');
    expect(scopesOf(template, 'field')).toContain('variable.other.constant.xaendar');
    expect(scopesOf(template, 'type')).toContain('entity.other.attribute-name.html');
    expect(scopesOf(template, 'fde68a')).not.toContain('variable.other.constant.xaendar');
    expect(scopesOf(template, 'top')).not.toContain('variable.other.constant.xaendar');
    expect(scopesOf(template, '42')).not.toContain('variable.other.constant.xaendar');
    expect(scopesOf(template, 'row')).toContain('entity.name.function.xaendar');
    expect(scopesOf(template, '(item')).toContain('punctuation.definition.parameters.begin.xaendar');
    expect(scopesOf(template, 'item:')).toContain('variable.parameter.xaendar');
    expect(scopesOf(template, ': Item')).toContain('punctuation.separator.type.xaendar');
    expect(scopesOf(template, 'Item,')).toContain('entity.name.type.ts');
    expect(scopesOf(template, ', index')).toContain('punctuation.separator.parameter.xaendar');
    expect(scopesOf(template, 'number')).toContain('support.type.primitive.ts');
    expect(scopesOf(template, ')>')).toContain('punctuation.definition.parameters.end.xaendar');
  });

  it('colors the control flow, with its conditions as expressions', () => {
    const template = [
      '@if (a() && (b)) { x } @else if (c) { y } @else { z }',
      '@for (item of items(); track item.id; i = $index) { {item} }',
      '@switch (kind) { @case (\'a\') { A } @default { D } }'
    ].join('\n');

    ['@if', '@else if', '@else {', '@for', 'of', 'track', '@switch', '@case', '@default'].forEach(keyword => {
      expect(scopesOf(template, keyword)).toContain('keyword.control.xaendar');
    });
    // Parentheses nested in a condition don't end it
    expect(scopesOf(template, 'b')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, 'items')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, '$index')).toContain('variable.language.xaendar');
    expect(scopesOf(template, '{ x')).toContain('punctuation.section.block.begin.xaendar');
    expect(scopesOf(template, '} @else if')).toContain('punctuation.section.block.end.xaendar');
    expect(scopesOf(template, '\'a\'')).toContain('string.quoted.single.ts');
  });

  it('colors the render of a template, with its arguments as expressions', () => {
    const template = '<ul>@render row(items()[0], (count), \'a)\')</ul> after';

    expect(scopesOf(template, '@render')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, 'row')).toContain('entity.name.function.xaendar');
    expect(scopesOf(template, '(items')).toContain('punctuation.definition.arguments.begin.xaendar');
    expect(scopesOf(template, 'items')).toContain('meta.embedded.expression.xaendar');
    // Parentheses nested in the arguments, and in their strings, don't end them
    expect(scopesOf(template, 'count')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, '\'a)\'')).toContain('string.quoted.single.ts');
    expect(scopesOf(template, ')</ul>')).toContain('punctuation.definition.arguments.end.xaendar');
    expect(scopesOf(template, 'after')).not.toContain('meta.embedded.expression.xaendar');
  });

  it('colors the conditional bindings declared in a tag', () => {
    const template = '<div @if (open) { class="a" } @else { class="b" }></div>';

    expect(scopesOf(template, '@if')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, 'open')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, '@else')).toContain('keyword.control.xaendar');
    expect(scopesOf(template, '} @else')).toContain('punctuation.section.block.end.xaendar');
  });

  it('colors the interpolations, in the text and in the attribute values, with nested braces', () => {
    const template = '<p title="{ heading }">{ { a: 1 }.a } { $first }</p>';

    expect(scopesOf(template, '{ heading')).toContain('punctuation.section.embedded.begin.xaendar');
    expect(scopesOf(template, 'heading')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, '{ {')).toContain('punctuation.section.embedded.begin.xaendar');
    expect(scopesOf(template, '.a')).toContain('meta.embedded.expression.xaendar');
    expect(scopesOf(template, '} {')).toContain('punctuation.section.embedded.end.xaendar');
    expect(scopesOf(template, '$first')).toContain('variable.language.xaendar');
  });

  it('leaves the comments alone', () => {
    const template = '<!-- @if (a) { {b} } -->';

    expect(scopesOf(template, '@if')).not.toContain('keyword.control.xaendar');
    expect(scopesOf(template, 'b')).not.toContain('meta.embedded.expression.xaendar');
  });
});
