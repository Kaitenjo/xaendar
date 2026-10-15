import { createSourceFile, type Diagnostic, DiagnosticCategory, type LanguageService, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysisResult } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateDiagnostics } from './template-diagnostics';

const TIMEOUT = 60_000;
let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

/**
 * Analyzes a template and returns its diagnostics as the text of the template they are reported on and their message.
 */
const diagnose = async (source: string) => getTemplateDiagnostics(await project.analyze(source)).map(({ span, message, category }) => [source.slice(span.start, span.end), message, category]);

describe('getTemplateDiagnostics', () => {
  it('reports the type errors on the exact characters of the template they come from', async () => {
    const source = '<b (click)="nope()">{ missing }</b>\n@for (item of items; track item().id) { {item().nam} }';

    expect(await diagnose(source)).toEqual([
      ['nope', 'Property \'nope\' does not exist on type \'App\'.', DiagnosticCategory.Error],
      ['missing', 'Property \'missing\' does not exist on type \'App\'.', DiagnosticCategory.Error],
      ['nam', 'Property \'nam\' does not exist on type \'{ id: number; name: string; }\'. Did you mean \'name\'?', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports the type errors of a binding that cannot be located more precisely on the whole binding', async () => {
    const source = '@import { Child } from \'./child\';\n<my-child label="a" size="big" (picked)="select()"></my-child>';

    expect(await diagnose(source)).toEqual([
      ['size="big"', 'Type \'string\' does not satisfy the expected type \'number\'.', DiagnosticCategory.Error],
      // The callee is copied verbatim from the template
      ['select', 'Expected 1 arguments, but got 0.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports the errors of the compiler on the name of the element, directive or attribute they refer to', async () => {
    expect(await diagnose('@import { Child } from \'./child\';\n<my-child></my-child>')).toEqual([
      ['my-child', 'my-child is missing the following required properties:\n ● label', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('<my-unknown></my-unknown>')).toEqual([
      ['my-unknown', 'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('<div @@tooltip></div>')).toEqual([
      ['tooltip', '@@tooltip selector is not associated to any Directive imported in the template', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('@import { Tooltip } from \'./directives\';\n<div @@tooltip(txt="a")></div>')).toEqual([
      ['txt', 'Unknown property "txt" on @@tooltip (Tooltip has no @Property with this name).', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports every node failing, the imports that cannot be resolved among them, and still type-checks the others', async () => {
    const source = '@import { Missing } from \'./child\';\n<my-unknown></my-unknown>\n<div @@tooltip></div>\n<p><my-unknown></my-unknown></p>\n<b>{ missing }</b>';

    expect(await diagnose(source)).toEqual([
      ['Missing', 'Class "Missing" was not found in the import from ./child', DiagnosticCategory.Error],
      ['my-unknown', 'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements', DiagnosticCategory.Error],
      ['tooltip', '@@tooltip selector is not associated to any Directive imported in the template', DiagnosticCategory.Error],
      ['my-unknown', 'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements', DiagnosticCategory.Error],
      ['missing', 'Property \'missing\' does not exist on type \'App\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports a syntax error on its span', async () => {
    expect(await diagnose('<b>{ a = 1 }</b>')).toEqual([
      ['=', '\'FirstAssignment\' is not allowed inside template expressions.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports an error without span at the start of the template', () => {
    const result: TemplateAnalysisResult = { analysis: undefined, error: new Error('boom'), ast: undefined };

    expect(getTemplateDiagnostics(result)).toEqual([{ span: { start: 0, end: 0 }, message: 'boom', category: DiagnosticCategory.Error }]);
  });

  it('reports the diagnostics of the unmapped lines on the element enclosing them, and the others at the start', async () => {
    const source = '<ul>\n  @for (item of items; track item().id) { <li>{ item().name }</li> }\n</ul>';
    const { analysis } = await project.analyze(source);
    const shimFile = createSourceFile(analysis!.shimPath, analysis!.languageService.getProgram()!.getSourceFile(analysis!.shimPath)!.text, ScriptTarget.Latest);
    // `let $index!: Signal<number>;`, declared by the shim only
    const unmapped = shimFile.text.indexOf('let $index');
    const diagnostic = (file: Diagnostic['file'], start?: number): Diagnostic => ({ file, start, length: 1, messageText: { messageText: 'chain', category: DiagnosticCategory.Warning, code: 1, next: [{ messageText: 'next', category: DiagnosticCategory.Warning, code: 2 }] }, category: DiagnosticCategory.Warning, code: 1 });
    const languageService = {
      getSyntacticDiagnostics: () => [diagnostic(shimFile, unmapped)],
      getSemanticDiagnostics: () => [diagnostic(shimFile, 0), diagnostic(undefined)]
    } as unknown as LanguageService;

    expect(getTemplateDiagnostics({ analysis: { ...analysis!, languageService }, error: undefined, ast: analysis!.ast })).toEqual([
      { span: { start: 1, end: 3 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 },
      { span: { start: 0, end: 0 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 },
      { span: { start: 0, end: 0 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 }
    ]);
  }, TIMEOUT);
});

describe('getTemplateDiagnostics unused imports', () => {
  it('reports the imports the template never uses as unnecessary, not as problems', async () => {
    const source = '@import { Child } from \'./child\';\n@import { Tooltip, Media as M } from \'./directives\';\n<my-child label="a" @@tooltip></my-child>';
    const diagnostics = getTemplateDiagnostics(await project.analyze(source));

    expect(diagnostics).toEqual([{ span: { start: source.indexOf('Media as M'), end: source.indexOf('Media as M') + 'Media as M'.length }, message: '\'M\' is declared but never used.', category: DiagnosticCategory.Suggestion, unnecessary: true }]);
  }, TIMEOUT);

  it('reports nothing for a template using its imports', async () => {
    expect(await diagnose('@import { Child } from \'./child\';\n<my-child label="a"></my-child>')).toEqual([]);
  }, TIMEOUT);
});

describe('getTemplateDiagnostics generic directives', () => {
  const imports = '@import { List } from \'./generic\';\n';

  beforeAll(() => {
    project.write('src/generic.ts', [
      'import { Directive, Event, InputSignal, Output, Property } from \'@xaendar/core\';',
      '@Directive({ selector: \'list\' })',
      'export class List<Item extends { id: number }, Key = string> {',
      '  @Property([]) accessor items!: InputSignal<Item[]>;',
      '  @Event() accessor picked!: Output<Key>;',
      '  @Event() accessor selected!: Output<Item>;',
      '}',
      ''
    ].join('\n'));
  });

  it('checks the properties and the events of a directive against the type arguments the template declares', async () => {
    const events = (key: string) => `${imports}<p @@list<{ id: number; name: string }, ${key}>(items="{ items }" (picked)="select($event)")></p>`;

    // The event of the directive carries the second type argument
    expect((await diagnose(events('number')))[0][1]).toContain('CustomEvent<number>');
    expect((await diagnose(events('string')))[0][1]).toContain('CustomEvent<string>');
  }, TIMEOUT);

  it('checks the value of a property against the type argument', async () => {
    const source = `${imports}<p @@list<{ id: number; name: string }>(items="{ items }")></p>\n<p @@list<{ id: number; name: string }>(items="{ [{ id: 1 }] }")></p>`;

    const diagnostics = await diagnose(source);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0][1]).toContain('name');
  }, TIMEOUT);

  it('reports a type argument that does not satisfy the constraint of the type parameter on the type arguments', async () => {
    const source = `${imports}<p @@list<string>(items="{ [] }")></p>`;

    expect(await diagnose(source)).toContainEqual(['string', 'Type \'string\' does not satisfy the constraint \'{ id: number; }\'.', DiagnosticCategory.Error]);
  }, TIMEOUT);

  it('accepts a generic directive without type arguments: a type parameter gets its default type, or any', async () => {
    expect(await diagnose(`${imports}<p @@list(items="{ items }")></p>`)).toEqual([]);

    // Key defaults to string, Item has no default
    const events = await diagnose(`${imports}<p @@list(items="{ items }" (picked)="select($event)")></p>`);
    expect(events[0][1]).toContain('CustomEvent<string>');
  }, TIMEOUT);

  it('infers the type parameters from the values bound to the properties', async () => {
    const events = await diagnose(`${imports}<p @@list(items="{ items }" (selected)="select($event)")></p>`);

    // Item is the type of the elements of the array bound to items, which the component declares
    expect(events).toHaveLength(1);
    expect(events[0][1]).toContain('CustomEvent<{ id: number; name: string; }>');
  }, TIMEOUT);

  it('prefers the type arguments of the template to the inferred ones, and infers the others', async () => {
    const source = `${imports}<p @@list<{ id: number }>(items="{ items }" (selected)="select($event)" (picked)="select($event)")></p>`;
    const events = await diagnose(source);

    // The type argument of the template is the local type named like the type parameter
    expect(events.map(([, message]) => message.match(/CustomEvent<[^>]*>/)?.[0])).toEqual(['CustomEvent<Item>', 'CustomEvent<string>']);
  }, TIMEOUT);

  it('reports an inferred type that does not satisfy the constraint of the type parameter on the directive', async () => {
    const diagnostics = await diagnose(`${imports}<p @@list(items="{ [1, 2] }")></p>`);

    expect(diagnostics).toContainEqual(['list', 'Type \'number\' does not satisfy the constraint \'{ id: number; }\'.', DiagnosticCategory.Error]);
  }, TIMEOUT);

  it('does not report the errors of the call inferring the type parameters, only those of the bindings', async () => {
    const diagnostics = await diagnose(`${imports}<p @@list(items="{ missing }")></p>`);

    expect(diagnostics).toEqual([['missing', 'Property \'missing\' does not exist on type \'App\'.', DiagnosticCategory.Error]]);
  }, TIMEOUT);

  it('gives the type parameters the template leaves out their default type', async () => {
    const events = await diagnose(`${imports}<p @@list<{ id: number; name: string }>(items="{ items }" (picked)="select($event)")></p>`);

    expect(events[0][1]).toContain('CustomEvent<string>');
  }, TIMEOUT);

  it('reports the type arguments of a directive that is not generic, or more than it has type parameters', async () => {
    expect(await diagnose('@import { Tooltip } from \'./directives\';\n<p @@tooltip<string>(text="a")></p>')).toEqual([
      ['string', '@@tooltip declares type arguments, but Tooltip is not generic.', DiagnosticCategory.Error]
    ]);
    expect(await diagnose(`${imports}<p @@list<{ id: number }, string, number>(items="{ [] }")></p>`)).toEqual([
      ['{ id: number }, string, number', '@@list declares 3 type arguments, but List has 2 type parameters (Item, Key).', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);
});

describe('getTemplateDiagnostics host directives', () => {
  beforeAll(() => {
    project.write('src/field.ts', [
      'import { CustomElement, WebComponent } from \'@xaendar/core\';',
      'import { Tooltip } from \'./directives\';',
      '@WebComponent({ selector: \'my-field\', hostDirectives: [{ directive: Tooltip, properties: [{ name: \'text\', alias: \'hint\' }], events: [\'shown\'] }], templateUrl: \'./field.html\' })',
      'export class Field extends CustomElement {}',
      ''
    ].join('\n'));
  });

  it('checks the inputs and the events the component exposes against the ones of the directive', async () => {
    const source = '@import { Field } from \'./field\';\n<my-field hint="a" (shown)="select($event)"></my-field>\n<my-field hint="{ 3 }"></my-field>';

    expect(await diagnose(source)).toEqual([
      ['$event', 'Argument of type \'CustomEvent<string>\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error],
      ['my-field', 'Type \'number\' does not satisfy the expected type \'string\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('treats what the component does not expose as an attribute and a native event of the element', async () => {
    expect(await diagnose('@import { Field } from \'./field\';\n<my-field text="a" (nope)="select(1)"></my-field>')).toEqual([
      ['(nope)="select(1)"', 'Property \'nope\' does not exist on type \'HTMLElementEventMap\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);
});
