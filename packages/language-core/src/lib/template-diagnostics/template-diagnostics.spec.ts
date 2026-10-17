import { createSourceFile, type Diagnostic, DiagnosticCategory, type LanguageService, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { analyzeTemplate, type TemplateAnalysisResult } from '../template-analysis/template-analysis';
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

  it('types a template variable with the type of the element it names, reporting its reads before the element and its duplicates', async () => {
    expect(await diagnose('<p>{ field.value }</p>\n<input #field />\n{ field.valu }')).toEqual([
      ['field', '"field" is read before the element it names is created: only an event handler can read a template variable declared after it', DiagnosticCategory.Error],
      ['valu', 'Property \'valu\' does not exist on type \'HTMLInputElement\'. Did you mean \'value\'?', DiagnosticCategory.Error]
    ]);

    expect(await diagnose('<input #field />\n<select #field />')).toEqual([
      ['field', 'Cannot redeclare block-scoped variable \'field\'.', DiagnosticCategory.Error],
      ['field', 'Cannot redeclare block-scoped variable \'field\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('types a @let with its value, or with the signal of its value when it reads one, reporting its reads before it', async () => {
    project.write('src/store.ts', 'import type { Signal } from \'@xaendar/core/signals\';\nexport declare const total: Signal<number>;\n');
    const source = [
      '@import { total } from \'./store\';',
      '<p>{ early }</p>',
      '@let early = 1;',
      '@let sum = total() + 1;',
      '@let label = title;',
      '{ sum().toFixed() } { label.length } { sum.toFixed() } { label() }'
    ].join('\n');

    expect(await diagnose(source)).toEqual([
      ['early', '"early" is read before its @let: only an event handler can read a @let declared after it', DiagnosticCategory.Error],
      ['toFixed', 'Property \'toFixed\' does not exist on type \'Computed<number>\'.', DiagnosticCategory.Error],
      ['label', 'This expression is not callable.\n  Type \'String\' has no call signatures.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('checks the arguments of a @render against the parameters of the template, typed with imported types too, which its content reads as signals', async () => {
    const source = [
      '@import { Row } from \'./utils\';',
      '@render row(items[0], 1)',
      '@render row(items[0], \'a\')',
      '@render row(items[0])',
      '@render row(items[0], 1, 2)',
      '<template #row(item: Row, index: number)>{ item().id } { item().nam } { index().toFixed() }</template>',
      '<template #wrong(value: Nope) />'
    ].join('\n');

    // The templates are declared at the start of their scope, before the @render, and their parameters are checked with their content
    expect(await diagnose(source)).toEqual([
      ['\'a\'', 'Argument of type \'string\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error],
      ['@render row(items[0])', 'Expected 2 arguments, but got 1.', DiagnosticCategory.Error],
      ['2', 'Expected 2 arguments, but got 3.', DiagnosticCategory.Error],
      ['nam', 'Property \'nam\' does not exist on type \'Row\'.', DiagnosticCategory.Error],
      ['Nope', 'Cannot find name \'Nope\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('lets a @render leave out the arguments of the optional parameters and of the ones with a default value, typed by it or as declared', async () => {
    const source = [
      '@import { Row } from \'./utils\';',
      '@render row(items[0])',
      '@render row(items[0], \'x\', true, 2)',
      '@render row(items[0], undefined)',
      '@render row(items[0], \'x\', 1)',
      '@render row()',
      '<template #row(item: Row, label = \'#\' + item().id, dense: boolean = title === \'\', count?: number)>',
      '  { label().toUpperCase() } { dense() } { count().toFixed() } { label().nope }',
      '</template>',
      '<template #wrong(first: number = \'a\', second = third(), third: number = 1) />'
    ].join('\n');

    expect(await diagnose(source)).toEqual([
      ['undefined', 'Argument of type \'undefined\' is not assignable to parameter of type \'string\'.', DiagnosticCategory.Error],
      ['1', 'Argument of type \'number\' is not assignable to parameter of type \'boolean\'.', DiagnosticCategory.Error],
      ['@render row()', 'Expected 1-4 arguments, but got 0.', DiagnosticCategory.Error],
      ['count', 'Object is possibly \'undefined\'.', DiagnosticCategory.Error],
      ['nope', 'Property \'nope\' does not exist on type \'string\'.', DiagnosticCategory.Error],
      ['\'a\'', 'Argument of type \'string\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error],
      ['third', 'Parameter \'second\' cannot reference identifier \'third\' declared after it.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports the render of a name that is not a template, and the reads of a template before the elements they need', async () => {
    expect(await diagnose('<input #field />\n@render field()')).toEqual([
      ['field', '"field" is not a template visible here: declare it with <template #field(…)> in this scope or in an enclosing one', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('@render row()\n<input #field />\n<template #row()>{ field.value }</template>')).toEqual([
      ['row', '"field" is read by the template rendered by @render row before the element it names is created: render the template after the element, or read the variable from an event handler', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reads the members and the imports of the template in the track expression of a @for', async () => {
    expect(await diagnose('@import { formatDate } from \'./utils\';\n@for (item of items; track title + formatDate(item().id)) { {item().name} }')).toEqual([]);
    expect(await diagnose('@for (item of items; track nope(item())) { }')).toEqual([
      ['nope', 'Property \'nope\' does not exist on type \'App\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('types a template variable naming a component with its class', async () => {
    expect(await diagnose('@import { Child } from \'./child\';\n<my-child #child label="a"></my-child>\n{ child.label() } { child.nope }')).toEqual([
      ['nope', 'Property \'nope\' does not exist on type \'Child\'.', DiagnosticCategory.Error]
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
      ['my-unknown', 'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements', DiagnosticCategory.Error],
      ['tooltip', '@@tooltip selector is not associated to any Directive imported in the template', DiagnosticCategory.Error],
      ['my-unknown', 'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements', DiagnosticCategory.Error],
      // An export the module doesn't have is reported by TypeScript on its name
      ['Missing', expect.stringMatching(/child"' has no exported member 'Missing'\.$/), DiagnosticCategory.Error],
      ['missing', 'Property \'missing\' does not exist on type \'App\'.', DiagnosticCategory.Error],
      ['Missing', '\'Missing\' is declared but never used.', DiagnosticCategory.Suggestion]
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
      getSemanticDiagnostics: () => [diagnostic(shimFile, 0), diagnostic(undefined)],
      getProgram: () => analysis!.languageService.getProgram()
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

describe('getTemplateDiagnostics imported symbols', () => {
  const imports = '@import { formatDate, Status, Shape, Row, LIMIT, default as shout, * as utils } from \'./utils\';\n@import { Rows } from \'./rows\';\n';

  beforeAll(() => {
    project.write('src/rows.ts', [
      'import { Directive, InputSignal, Property } from \'@xaendar/core\';',
      '@Directive({ selector: \'rows\' })',
      'export class Rows<Item extends { id: number }> {',
      '  @Property([]) accessor items!: InputSignal<Item[]>;',
      '}',
      ''
    ].join('\n'));
  });

  it('reads functions, enums, constants, classes, default exports and namespaces in the expressions, and types in the type arguments', async () => {
    const source = `${imports}<p title="{ formatDate(LIMIT) }" @@rows<Row>(items="{ items }")>{ Status.Active } { items[0] instanceof Shape } { shout('a') } { utils.LIMIT }</p>`;

    expect(await diagnose(source)).toEqual([]);
  }, TIMEOUT);

  it('reports what TypeScript reports about the symbols, on the template', async () => {
    const source = '@import { formatDate, Row } from \'./utils\';\n{ formatDate(\'a\') } { Row }';

    expect(await diagnose(source)).toEqual([
      ['\'a\'', 'Argument of type \'string\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error],
      ['Row', '\'Row\' only refers to a type, but is being used as a value here.', DiagnosticCategory.Error],
      // A type read as a value is not a reference to it
      ['Row', '\'Row\' is declared but never used.', DiagnosticCategory.Suggestion]
    ]);
  }, TIMEOUT);

  it('reports a symbol imported under the name of a member of the component on its name', async () => {
    expect(await diagnose('@import { title } from \'./utils\';\n{ title() }')).toEqual([
      ['title', '\'title\' is also a member of App: import it under another name (… as name), or rename the member.', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('@import { title as heading } from \'./utils\';\n{ heading() }')).toEqual([]);
  }, TIMEOUT);

  it('reports a symbol imported under a name the generated code reserves, without telling it unused', async () => {
    expect(await diagnose('@import { title as root } from \'./utils\';')).toEqual([
      ['root', '"root" is reserved in templates: import it under another name (… as name).', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reads the exports of a package, and the components and the symbols reached through an alias of the project', async () => {
    const source = '@import { CURRENCY, formatPrice } from \'@acme/format\';\n@import { Child } from \'@app/child\';\n@import { LIMIT } from \'@app/utils\';\n<my-child label="{ formatPrice(LIMIT) }" />{ CURRENCY }';

    expect(await diagnose(source)).toEqual([]);
    expect(await diagnose('@import { formatPrice } from \'@acme/format\';\n{ formatPrice(\'a\') }')).toEqual([
      ['\'a\'', 'Argument of type \'string\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error]
    ]);
    expect(await diagnose('@import { nope } from \'@acme/format\';')).toEqual([
      ['nope', 'Module \'"@acme/format"\' has no exported member \'nope\'.', DiagnosticCategory.Error],
      ['nope', '\'nope\' is declared but never used.', DiagnosticCategory.Suggestion]
    ]);
  }, TIMEOUT);

  it('reports a package that is not installed, and an alias the project doesn\'t declare, on their path', async () => {
    expect(await diagnose('@import { x } from \'@acme/missing\';\n@import { y } from \'@nope/utils\';')).toEqual([
      ['@acme/missing', 'Cannot find module "@acme/missing"', DiagnosticCategory.Error],
      ['@nope/utils', 'Cannot find module "@nope/utils"', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports the symbols no expression and no type argument reads as unnecessary', async () => {
    const source = '@import { formatDate, Status, Row as Line } from \'./utils\';\n{ formatDate(1) }';

    expect(await diagnose(source)).toEqual([
      ['Status', '\'Status\' is declared but never used.', DiagnosticCategory.Suggestion],
      ['Row as Line', '\'Line\' is declared but never used.', DiagnosticCategory.Suggestion]
    ]);
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

  it('uses the type arguments of the template instead of inferring, leaving the others to their default type', async () => {
    const source = `${imports}<p @@list<{ id: number }>(items="{ items }" (selected)="select($event)" (picked)="select($event)")></p>`;
    const events = await diagnose(source);

    // The type argument is written as is in the instantiation of the class
    expect(events.map(([, message]) => message.match(/CustomEvent<[^>]*>/)?.[0])).toEqual(['CustomEvent<{ id: number; }>', 'CustomEvent<string>']);
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

describe('getTemplateDiagnostics generic components', () => {
  const imports = '@import { Grid } from \'./grid\';\n';

  beforeAll(() => {
    project.write('src/grid.ts', [
      'import { Event, InputSignal, Output, Property, WebComponent } from \'@xaendar/core\';',
      '@WebComponent({ selector: \'my-grid\', templateUrl: \'./grid.html\' })',
      'export class Grid<Row extends { id: number }, Key = string> {',
      '  @Property([]) accessor rows!: InputSignal<Row[]>;',
      '  @Property(null!) accessor key!: InputSignal<Key>;',
      '  @Event() accessor picked!: Output<Key>;',
      '  @Event() accessor selected!: Output<Row>;',
      '}',
      ''
    ].join('\n'));
  });

  it('infers the type parameters from the values bound to the properties', async () => {
    const events = await diagnose(`${imports}<my-grid rows="{ items }" (selected)="select($event)"></my-grid>`);

    // Row is the type of the elements of the array bound to rows, which the component declares
    expect(events).toHaveLength(1);
    expect(events[0][1]).toContain('CustomEvent<{ id: number; name: string; }>');
  }, TIMEOUT);

  it('checks the value of a property against the inferred type parameter', async () => {
    expect(await diagnose(`${imports}<my-grid rows="{ items }" (picked)="select($event)"></my-grid>`)).toEqual([
      ['$event', 'Argument of type \'CustomEvent<string>\' is not assignable to parameter of type \'number\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('reports an inferred type that does not satisfy the constraint of the type parameter on the tag name', async () => {
    expect(await diagnose(`${imports}<my-grid rows="{ [1, 2] }"></my-grid>`)).toContainEqual(
      ['my-grid', 'Type \'number\' does not satisfy the constraint \'{ id: number; }\'.', DiagnosticCategory.Error]
    );
  }, TIMEOUT);

  it('accepts a generic component binding nothing to infer from: a type parameter gets its default type, or any', async () => {
    expect(await diagnose(`${imports}<my-grid></my-grid>`)).toEqual([]);

    // Key defaults to string, Row has no default
    const events = await diagnose(`${imports}<my-grid (picked)="select($event)"></my-grid>`);
    expect(events[0][1]).toContain('CustomEvent<string>');
  }, TIMEOUT);

  it('instantiates the component with the type arguments the element declares, leaving the others to their default type', async () => {
    const explicit = await diagnose(`${imports}<my-grid({ id: number }, number) rows="{ items }" (picked)="select($event)"></my-grid>`);
    expect(explicit).toHaveLength(1);
    expect(explicit[0][1]).toContain('CustomEvent<number>');

    const partial = await diagnose(`${imports}<my-grid({ id: number }) rows="{ items }" (selected)="select($event)"></my-grid>`);
    expect(partial).toHaveLength(1);
    expect(partial[0][1]).toContain('CustomEvent<{ id: number; }>');
  }, TIMEOUT);

  it('does not infer the type parameters the element leaves out from the bindings: they take their default type', async () => {
    // Key would be inferred as number from the value without type arguments, it is string with them
    expect(await diagnose(`${imports}<my-grid rows="{ items }" key="{ 1 }"></my-grid>`)).toEqual([]);
    expect(await diagnose(`${imports}<my-grid({ id: number }) key="{ 1 }"></my-grid>`)).toEqual([
      ['key="{ 1 }"', 'Type \'number\' does not satisfy the expected type \'string\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('type-checks the template of a generic component, reading its type parameters as their constraints', async () => {
    const source = '{ rows()[0].id }{ rows()[0].missing }';
    const analysis = await analyzeTemplate(project.path('src/grid.html'), source, new Map([[project.path('src/grid.ts'), ['Grid']]]));

    expect(getTemplateDiagnostics(analysis).map(({ span, message }) => [source.slice(span.start, span.end), message])).toEqual([
      ['missing', 'Property \'missing\' does not exist on type \'{ id: number; }\'.']
    ]);
  }, TIMEOUT);

  it('reports a type argument that does not satisfy the constraint of the type parameter on the type arguments', async () => {
    expect(await diagnose(`${imports}<my-grid(string)></my-grid>`)).toContainEqual(
      ['string', 'Type \'string\' does not satisfy the constraint \'{ id: number; }\'.', DiagnosticCategory.Error]
    );
  }, TIMEOUT);

  it('does not report the errors of the call inferring the type parameters, only those of the bindings', async () => {
    expect(await diagnose(`${imports}<my-grid rows="{ missing }"></my-grid>`)).toEqual([
      ['missing', 'Property \'missing\' does not exist on type \'App\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('types a template variable naming a generic component with the instantiation of the component', async () => {
    expect(await diagnose(`${imports}<my-grid #grid rows="{ items }"></my-grid>\n{ grid.rows()[0].name } { grid.rows()[0].missing }`)).toEqual([
      ['missing', 'Property \'missing\' does not exist on type \'{ id: number; name: string; }\'.', DiagnosticCategory.Error]
    ]);
    expect(await diagnose(`${imports}<my-grid({ id: number }) #grid></my-grid>\n{ grid.rows()[0].name }`)).toEqual([
      ['name', 'Property \'name\' does not exist on type \'{ id: number; }\'.', DiagnosticCategory.Error]
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
      ['hint="{ 3 }"', 'Type \'number\' does not satisfy the expected type \'string\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);

  it('treats what the component does not expose as an attribute and a native event of the element', async () => {
    expect(await diagnose('@import { Field } from \'./field\';\n<my-field text="a" (nope)="select(1)"></my-field>')).toEqual([
      ['(nope)="select(1)"', 'Property \'nope\' does not exist on type \'HTMLElementEventMap\'.', DiagnosticCategory.Error]
    ]);
  }, TIMEOUT);
});
