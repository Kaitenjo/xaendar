import { readFileSync } from 'node:fs';
import type { LanguageService } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateBindingCompletions, getTemplateCompletions, getTemplateExpressionCompletions, getTemplateImportCompletions, getTemplateImportPathCompletions, getTemplateKeywordCompletions, getTemplateSelectorCompletions, getTemplateSourceBindingCompletions } from './template-completions';

const TIMEOUT = 60_000;
const source = '<b title="{ title }">{ items[0].na }</b>';
let project: FixtureProject;
let analysis: TemplateAnalysis;

beforeAll(async () => {
  project = createFixtureProject();
  analysis = (await project.analyze(source)).analysis!;
  // Builds the program and type-checks the shim once, so that the tests ask TypeScript about a warm program
  analysis.languageService.getSemanticDiagnostics(analysis.shimPath);
}, TIMEOUT);

afterAll(() => {
  project.dispose();
});

const names = (offset: number, target = analysis) => getTemplateCompletions(target, offset).map(({ name }) => name);

describe('getTemplateCompletions', () => {
  it('proposes the members of the component for an identifier of an expression', () => {
    expect(names(source.indexOf('title }') + 3)).toEqual(expect.arrayContaining(['items', 'select', 'title']));
  });

  it('proposes the members of an object after a dot, right at the end of the name being typed', () => {
    const completions = getTemplateCompletions(analysis, source.indexOf('na }') + 2);

    expect(completions.map(({ name }) => name)).toEqual(expect.arrayContaining(['id', 'name']));
    expect(completions.find(({ name }) => name === 'id')).toEqual({ name: 'id', kind: 'property', sortText: expect.any(String) });
  });

  it('proposes nothing outside of an expression, when the shim is not in the program or TypeScript has no completions', () => {
    expect(names(1)).toEqual([]);
    expect(names(source.indexOf('title }'), { ...analysis, shimPath: '/missing.ts' })).toEqual([]);

    const languageService = { ...analysis.languageService, getCompletionsAtPosition: () => undefined } as unknown as LanguageService;
    expect(names(source.indexOf('title }'), { ...analysis, languageService })).toEqual([]);
  });
});

describe('getTemplateCompletions of the beginning of $event', () => {
  it.each(['$', '$e', '$ev'])('proposes $event in the parameters of a handler while %s is being written', async beginning => {
    const template = `<b (click)="select(${beginning})">x</b>`;
    const { analysis } = await project.analyze(template);

    expect(names(template.indexOf(beginning) + beginning.length, analysis!)).toContain('$event');
  }, TIMEOUT);

  it('proposes $event in the parameters of the event of a directive while its beginning is being written', async () => {
    const template = '@import { Tooltip } from \'./directives\';\n<b @@tooltip((shown)="select($e)")>x</b>';
    const { analysis } = await project.analyze(template);

    expect(names(template.indexOf('$e') + 2, analysis!)).toContain('$event');
  }, TIMEOUT);
});

describe('getTemplateExpressionCompletions', () => {
  const FOR = '@for (item of items; track item.id) { ';

  /**
   * Returns the completions at the `|` marking the offset of a template, as `name:kind:sortText@start-end`.
   */
  const completionsOf = async (template: string, triggerCharacter?: string) => (await getTemplateExpressionCompletions(project.path('src/app.html'), template.replace('|', ''), template.indexOf('|'), new Map([[project.path('src/app.ts'), ['App']]]), triggerCharacter))
    ?.map(({ name, kind, sortText, replacementSpan }) => `${name}:${kind}:${sortText}@${replacementSpan!.start}-${replacementSpan!.end}`);

  /**
   * Returns the completions at the `|` marking the offset of a template sorted like the editor sorts them, as `name:kind:sortText`.
   */
  const sortedCompletionsOf = async (template: string, triggerCharacter?: string) => (await getTemplateExpressionCompletions(project.path('src/app.html'), template.replace('|', ''), template.indexOf('|'), new Map([[project.path('src/app.ts'), ['App']]]), triggerCharacter))!
    .toSorted((first, second) => first.sortText.localeCompare(second.sortText))
    .map(({ name, kind, sortText }) => `${name}:${kind}:${sortText}`);

  it('proposes the members of the component in an interpolation being written, while the template doesn\'t compile', async () => {
    const completions = await completionsOf('<b>{|</b>');
    expect(completions).toEqual(expect.arrayContaining(['items:property:1@4-4', 'title:property:1@4-4', 'select:method:2@4-4']));
    expect((await completionsOf('<b>{ ti|</b>'))).toContain('title:property:1@5-7');
    expect((await completionsOf('<b title="{ |"></b>'))).toContain('title:property:1@12-12');
    expect((await completionsOf('@import { Child } from \'./child\';\n<my-child label="{ | }"></my-child>'))).toContain('title:property:1@53-53');
  }, TIMEOUT);

  it('sorts the members of the classes of the component first, then the ones of CustomElement, then the ones of the DOM, fields before methods', async () => {
    const completions = await sortedCompletionsOf('<b>{|</b>');

    expect(completions.slice(0, 3)).toEqual(['items:property:1', 'title:property:1', 'select:method:2']);
    expect(completions).toEqual(expect.arrayContaining(['effect:method:4', 'onInit:method:4', 'hidden:property:5', 'click:method:6']));
    // A member of the DOM declared again by the component is one of its own
    expect(completions.filter(completion => completion.startsWith('title:'))).toEqual(['title:property:1']);
  }, TIMEOUT);

  it('proposes the variables of the template in scope first, in the order they are declared, a member named like one of them left out', async () => {
    expect((await sortedCompletionsOf('@for (title of items; track title.id) { { | } }')).slice(0, 8)).toEqual([
      'title:let:0000', '$index:let:0001', '$first:let:0002', '$last:let:0003', '$even:let:0004', '$odd:let:0005',
      'items:property:1', 'select:method:2'
    ]);
  }, TIMEOUT);

  it('proposes only the variables of the template on one of them, and only the members of an object after its dot', async () => {
    expect(await completionsOf(`${FOR}{ item| } }`)).toEqual(['item:let:0000@40-44', '$index:let:0001@40-44', '$first:let:0002@40-44', '$last:let:0003@40-44', '$even:let:0004@40-44', '$odd:let:0005@40-44']);
    expect(await completionsOf(`${FOR}{ items[0].| } }`)).toEqual(['id:property:11@49-49', 'name:property:11@49-49']);
  }, TIMEOUT);

  it('proposes only the methods of the component on the name of the method an event calls, in the same order', async () => {
    const completions = await sortedCompletionsOf(`${FOR}<b (click)="|">x</b> }`);

    expect(completions[0]).toBe('select:method:2');
    expect(completions).toEqual(expect.arrayContaining(['effect:method:4', 'click:method:6']));
    // The functions of the project can be called too
    expect(completions.every(completion => completion.includes(':method:') || completion.includes(':function:'))).toBe(true);
    expect(await completionsOf('<b (click)="se|">x</b>')).toContain('select:method:2@12-14');
  }, TIMEOUT);

  it('proposes $event first in the arguments of the method of an event, also after the ( triggering the completion', async () => {
    expect((await sortedCompletionsOf('<b (click)="select(|">x</b>', '(')).slice(0, 4)).toEqual(['$event:let:0000', 'items:property:1', 'title:property:1', 'select:method:2']);
    expect(await completionsOf('<b (click)="select(|">x</b>', '(')).toContain('$event:let:0000@19-19');
    expect(await completionsOf('<b (click)="select($e|)">x</b>')).toEqual(['$event:let:0000@19-21']);
    expect((await sortedCompletionsOf(`${FOR}<b (click)="select(|)">x</b> }`)).slice(0, 3)).toEqual(['$event:let:0000', 'item:let:0001', '$index:let:0002']);
  }, TIMEOUT);

  it('proposes the variables of the template and the members of the component in the condition of a block, also after the ( opening it', async () => {
    expect((await sortedCompletionsOf('@if (|', '(')).slice(0, 3)).toEqual(['items:property:1', 'title:property:1', 'select:method:2']);
    expect((await sortedCompletionsOf('@if (title) {\n} @else if (|)\n<p></p>')).slice(0, 3)).toEqual(['items:property:1', 'title:property:1', 'select:method:2']);
    expect((await sortedCompletionsOf(`${FOR}@if (|) {\n} }`)).slice(0, 2)).toEqual(['item:let:0000', '$index:let:0001']);
    expect((await sortedCompletionsOf('@switch (|) {\n}')).slice(0, 3)).toEqual(['items:property:1', 'title:property:1', 'select:method:2']);
    expect(await completionsOf('@for (item of ite|')).toContain('items:property:1@14-17');
  }, TIMEOUT);

  it('proposes the variables of the template and the members of the component in the arguments of a @render, also after the ( opening them', async () => {
    const declaration = '\n<template #row(label: string, count: number) />';
    expect((await sortedCompletionsOf(`@render row(|${declaration}`, '(')).slice(0, 3)).toEqual(['row:let:0000', 'items:property:1', 'title:property:1']);
    expect(await completionsOf(`@render row(title, ite|)${declaration}`)).toContain('items:property:1@19-22');
  }, TIMEOUT);

  it('proposes the values the template imports with the fields of the component, its types left out', async () => {
    const template = '@import { formatDate, Status as State, Row, * as utils } from \'./utils\';\n<b>{|</b>';
    const at = template.indexOf('|');
    const completions = await completionsOf(template);

    expect(completions).toEqual(expect.arrayContaining([`formatDate:function:1@${at}-${at}`, `State:enum:1@${at}-${at}`, `utils:module:1@${at}-${at}`, `title:property:1@${at}-${at}`]));
    // A type, and an export imported already under another name
    expect(completions!.some(completion => completion.startsWith('Row:') || completion.startsWith('Status:'))).toBe(false);
  }, TIMEOUT);

  it('proposes the values of the project the template doesn\'t import yet last, adding their @import, the ones named like a member left out', async () => {
    const header = '@import { formatDate } from \'./utils\';\n';
    const source = `${header}<b>{ LI }</b>`;
    const completions = await getTemplateExpressionCompletions(project.path('src/app.html'), source, source.lastIndexOf(' }'), new Map([[project.path('src/app.ts'), ['App']]]));
    const insertAt = header.indexOf(' }');

    expect(completions!.find(({ name }) => name === 'LIMIT')).toEqual({
      name: 'LIMIT',
      kind: 'const',
      detail: './utils',
      sortText: '9',
      replacementSpan: { start: source.indexOf('LI'), end: source.lastIndexOf(' }') },
      additionalEdits: [{ span: { start: insertAt, end: insertAt }, newText: ', LIMIT' }]
    });
    // Imported already, a member of the component, a type, the class of the component itself
    expect(completions!.filter(({ name }) => ['formatDate', 'title', 'Row', 'App'].includes(name)).map(({ name, sortText }) => `${name}:${sortText}`).toSorted()).toEqual(['formatDate:1', 'title:1']);
  }, TIMEOUT);

  it('proposes no value to import when the files of the project export none', async () => {
    const other = createFixtureProject();
    const tsconfig = JSON.parse(readFileSync(other.path('tsconfig.json'), 'utf-8'));
    other.write('tsconfig.json', JSON.stringify({ ...tsconfig, include: ['src/*.html'] }));
    const completions = await getTemplateExpressionCompletions(other.path('src/app.html'), '<b>{  }</b>', 5, new Map([[other.path('src/app.ts'), ['App']]]));

    expect(completions).toContainEqual(expect.objectContaining({ name: 'title', sortText: '1' }));
    expect(completions!.some(({ sortText }) => sortText === '9')).toBe(false);
    other.dispose();
  }, TIMEOUT);

  it('proposes the functions the template imports or could import on the name of the method an event calls', async () => {
    const template = '@import { formatDate, Status } from \'./utils\';\n<b (click)="|">x</b>';
    const at = template.indexOf('|');
    const completions = await completionsOf(template);

    expect(completions).toEqual(expect.arrayContaining([`formatDate:function:1@${at}-${at}`]));
    expect(completions!.some(completion => completion.startsWith('Status:') || completion.startsWith('Shape:'))).toBe(false);
  }, TIMEOUT);

  it('proposes nothing after the ( of a call triggering the completion in an interpolation', async () => {
    expect(await completionsOf('<b>{ select(| }</b>', '(')).toEqual([]);
  }, TIMEOUT);

  it('proposes nothing when the closed template doesn\'t compile either, or leaves out the expression', async () => {
    expect(await completionsOf('<b>{ ti|</div>')).toEqual([]);
    expect(await completionsOf('@import { Child } from \'./child\';\n<my-child (picked)="select(|)"></my-child>')).toEqual([]);
  }, TIMEOUT);

  it('leaves the offsets not in an expression to the other completions', async () => {
    expect(await completionsOf('<b>ti|</b>')).toBeUndefined();
  }, TIMEOUT);
});

describe('getTemplateKeywordCompletions', () => {
  it('proposes the blocks that can be written after a @, as snippets replacing the keyword written so far, proposing the completions of their condition again', () => {
    const source = '@if (a) {\n}\n@el';
    const replacementSpan = { start: 12, end: 15 };

    expect(getTemplateKeywordCompletions(source, source.length)).toEqual([
      { name: '@if', kind: 'keyword', sortText: '0', replacementSpan, snippet: '@if ($1) {\n\t$0\n}', retrigger: true },
      { name: '@for', kind: 'keyword', sortText: '1', replacementSpan, snippet: '@for (item of $1) {\n\t$0\n}', retrigger: true },
      { name: '@switch', kind: 'keyword', sortText: '2', replacementSpan, snippet: '@switch ($1) {\n\t@case ($2) {\n\t\t$0\n\t}\n}', retrigger: true },
      { name: '@render', kind: 'keyword', sortText: '3', replacementSpan, snippet: '@render $1($0)', retrigger: false },
      { name: '@else', kind: 'keyword', sortText: '4', replacementSpan, snippet: '@else {\n\t$0\n}', retrigger: false },
      { name: '@else if', kind: 'keyword', sortText: '5', replacementSpan, snippet: '@else if ($1) {\n\t$0\n}', retrigger: true }
    ]);
  });

  it('proposes @case and @default in a @switch block, @import before anything else, proposing the completions of its path again', () => {
    const switchBlock = '@switch (a) {\n  @';

    expect(getTemplateKeywordCompletions(switchBlock, switchBlock.length)?.map(({ snippet, retrigger }) => [snippet, retrigger])).toEqual([['@case ($1) {\n\t$0\n}', false], ['@default {\n\t$0\n}', false]]);
    expect(getTemplateKeywordCompletions('@', 1)?.at(-1)).toEqual(expect.objectContaining({ snippet: '@import { $2 } from \'$1\';', retrigger: true }));
  });

  it('leaves the offsets not on the keyword of a block to the other completions', () => {
    expect(getTemplateKeywordCompletions('<b @@', 5)).toBeUndefined();
  });
});

describe('getTemplateSourceBindingCompletions', () => {
  const imports = '@import { Child } from \'./child\';\n@import { Tooltip } from \'./directives\';\n';

  it('proposes the bindings read from the imports of the source, without an analysis of the template', async () => {
    const source = `${imports}<p @@tooltip(text="a" (`;
    const completions = await getTemplateSourceBindingCompletions(project.path('src/never-analyzed.html'), source, source.length);

    expect(completions?.map(({ name }) => name)).toEqual(['shown']);
  }, TIMEOUT);

  it('proposes the events of a component on the name of an attribute, while the template cannot be lexed', async () => {
    const source = `${imports}<my-child (`;
    const completions = await getTemplateSourceBindingCompletions(project.path('src/never-analyzed.html'), source, source.length);

    expect(completions?.map(({ name }) => name)).toEqual(['closed', 'picked']);
  }, TIMEOUT);

  it('leaves the offsets not on the name of a binding to the other completions', async () => {
    expect(await getTemplateSourceBindingCompletions(project.path('src/never-analyzed.html'), `${imports}<p>{ ti`, imports.length + 9)).toBeUndefined();
  }, TIMEOUT);
});

describe('getTemplateBindingCompletions', () => {
  const imports = '@import { Child } from \'./child\';\n@import { Tooltip, Media } from \'./directives\';\n';
  let metadatas: TemplateAnalysis['metadatas'];

  beforeAll(async () => {
    metadatas = (await project.analyze(`${imports}<my-child label="a"></my-child>`)).analysis!.metadatas;
  }, TIMEOUT);

  /**
   * Returns the completions at the end of a template being written after the imports, as `name@start-end`.
   */
  const completionsOf = (template: string) => getTemplateBindingCompletions(metadatas, `${imports}${template}`, imports.length + template.length)
    ?.map(({ name, kind, sortText, replacementSpan }) => `${name}:${kind}:${sortText}@${replacementSpan!.start - imports.length}-${replacementSpan!.end - imports.length}`);

  it('proposes the inputs of a component, aliased ones included, then its events, on the name of an attribute', () => {
    expect(completionsOf('<my-child la')).toEqual(['label:property:0@10-12', 'size:property:0@10-12', '(closed):event:1@10-12', '(picked):event:1@10-12']);
  });

  it('proposes the events of a component, inherited ones included, after the ( of an event', () => {
    expect(completionsOf('<my-child (')).toEqual(['closed:event:1@11-11', 'picked:event:1@11-11']);
  });

  it('proposes the bindings of the directive whose parentheses hold the name', () => {
    expect(completionsOf('<my-child @@tooltip(')).toEqual(['text:property:0@20-20', '(shown):event:1@20-20']);
    expect(completionsOf('<my-child @@tooltip((')).toEqual(['shown:event:1@21-21']);
    expect(completionsOf('<my-child *media(')).toEqual(['query:property:0@17-17']);
  });

  it('proposes nothing on an element or directive that is not imported, even while the template doesn\'t compile', () => {
    expect(completionsOf('<div ')).toEqual([]);
    expect(completionsOf('<my-child @@missing(')).toEqual([]);
  });

  it('leaves to the other completions the offsets not on the name of an attribute or event', () => {
    expect(completionsOf('<my-child label="')).toBeUndefined();
    expect(completionsOf('{ la')).toBeUndefined();
  });
});

describe('getTemplateSelectorCompletions', () => {
  const imports = '@import { Child } from \'./child\';\n@import { Tooltip, Media as M } from \'./directives\';\n';

  /**
   * Returns the completions at the end of a template being written after the imports, as `name:kind@start-end`.
   */
  const completionsOf = async (template: string, header = imports) => (await getTemplateSelectorCompletions(project.path('src/app.html'), `${header}${template}`, header.length + template.length))
    ?.map(({ name, kind, sortText, replacementSpan }) => `${name}:${kind}:${sortText}@${replacementSpan!.start - header.length}-${replacementSpan!.end - header.length}`);

  it('proposes the imported components after the < of a tag, while the template doesn\'t compile', async () => {
    expect(await completionsOf('<')).toEqual(['my-child:component:0@1-1']);
    expect(await completionsOf('<p>x</p>\n<my-')).toEqual(['my-child:component:0@10-13']);
  }, TIMEOUT);

  it('proposes the imported directives after the @@ or the * of a binding', async () => {
    expect(await completionsOf('<my-child @@')).toEqual(['tooltip:directive:0@12-12', 'media:directive:0@12-12']);
    expect(await completionsOf('<my-child *me')).toEqual(['tooltip:directive:0@11-13', 'media:directive:0@11-13']);
  }, TIMEOUT);

  it('proposes the components of the project that are not imported yet, with the import to add, after the imported ones', async () => {
    const completions = await getTemplateSelectorCompletions(project.path('src/app.html'), '<', 1);

    expect(completions).toEqual([{
      name: 'my-child',
      kind: 'component',
      detail: 'Child - ./child',
      sortText: '1',
      replacementSpan: { start: 1, end: 1 },
      additionalEdits: [{ span: { start: 0, end: 0 }, newText: '@import { Child } from \'./child\';\n' }]
    }]);
  }, TIMEOUT);

  it('proposes the directives not imported yet after the imported ones, adding them to the statement importing from their module', async () => {
    const header = '@import { Child } from \'./child\';\n@import { Tooltip } from \'./directives\';\n';
    const completions = await getTemplateSelectorCompletions(project.path('src/app.html'), `${header}<my-child @@`, header.length + 12);
    const insertAt = header.indexOf(' }', header.indexOf('Tooltip'));

    expect(completions!.map(({ name, sortText }) => `${name}:${sortText}`)).toEqual(['tooltip:0', 'media:1']);
    expect(completions![1].detail).toBe('Media - ./directives');
    expect(completions![1].additionalEdits).toEqual([{ span: { start: insertAt, end: insertAt }, newText: ', Media' }]);
  }, TIMEOUT);

  it('writes the import of a component not imported yet after the last statement', async () => {
    const header = '@import { Tooltip, Media } from \'./directives\';';
    const [completion] = (await getTemplateSelectorCompletions(project.path('src/app.html'), `${header}\n<`, header.length + 2))!;

    expect(completion.additionalEdits).toEqual([{ span: { start: header.length, end: header.length }, newText: '\n@import { Child } from \'./child\';' }]);
  }, TIMEOUT);

  it('proposes only the imported ones when the project declares nothing else', async () => {
    const other = createFixtureProject();
    other.write('src/child.ts', 'export {};\n');
    other.write('src/directives.ts', 'export {};\n');

    expect(await getTemplateSelectorCompletions(other.path('src/app.html'), '<', 1)).toEqual([]);
    other.dispose();
  }, TIMEOUT);

  it('leaves to the other completions the offsets not on a selector', async () => {
    expect(await completionsOf('<my-child la')).toBeUndefined();
    expect(await completionsOf('{ title }')).toBeUndefined();
  }, TIMEOUT);
});

describe('getTemplateImportCompletions', () => {
  /**
   * Returns the completions at the `|` marking the offset of a template, as `name:kind:detail@start-end`.
   */
  const completionsOf = async (template: string) => (await getTemplateImportCompletions(project.path('src/app.html'), template.replace('|', ''), template.indexOf('|')))
    ?.map(({ name, kind, detail, replacementSpan }) => `${name}:${kind}:${detail}@${replacementSpan!.start}-${replacementSpan!.end}`);

  it('proposes the components and directives of the module between the braces of an @import', async () => {
    expect(await completionsOf('@import { | } from \'./directives\';')).toEqual(['Tooltip:directive:tooltip@10-10', 'Media:directive:media@10-10']);
    expect(await completionsOf('@import { | } from \'./child\';')).toEqual(['Child:component:my-child@10-10']);
    expect(await completionsOf('@import { Med| } from \'./directives\';')).toEqual(['Tooltip:directive:tooltip@10-13', 'Media:directive:media@10-13']);
  }, TIMEOUT);

  it('leaves out the symbols already imported', async () => {
    expect(await completionsOf('@import { Tooltip, | } from \'./directives\';')).toEqual(['Media:directive:media@19-19']);
  }, TIMEOUT);

  it('proposes the other exports of the module with what they declare, the default one as a snippet naming it', async () => {
    expect(await completionsOf('@import { LIMIT, | } from \'./utils\';')).toEqual([
      'formatDate:function:undefined@17-17',
      'title:function:undefined@17-17',
      'default:function:undefined@17-17',
      'Status:enum:undefined@17-17',
      'Row:interface:undefined@17-17',
      'Shape:class:undefined@17-17'
    ]);
    const completions = await getTemplateImportCompletions(project.path('src/app.html'), '@import {  } from \'./utils\';', 10);
    expect(completions!.find(({ name }) => name === 'default')).toEqual(expect.objectContaining({ snippet: 'default as $1', sortText: '1' }));
  }, TIMEOUT);

  it('proposes the exports of a package, and the components of a module reached through an alias of the project', async () => {
    expect(await completionsOf('@import { | } from \'@app/child\';')).toEqual(['Child:component:my-child@10-10']);
    // The declarations of a package are part of the program once the template imports from it
    await project.analyze('@import { formatPrice } from \'@acme/format\';\n{ formatPrice(1) }');
    expect(await completionsOf('@import { formatPrice, | } from \'@acme/format\';')).toEqual(['CURRENCY:const:undefined@23-23']);
  }, TIMEOUT);

  it('proposes nothing for a module that cannot be resolved, and leaves to the other completions the offsets not on a symbol of an @import', async () => {
    expect(await completionsOf('@import { | } from \'./missing\';')).toEqual([]);
    expect(await completionsOf('@import { Child } from \'./child\';\n<|')).toBeUndefined();
  }, TIMEOUT);
});

describe('getTemplateImportPathCompletions', () => {
  const imports = '@import { A } from \'';

  /**
   * Returns the completions at the `|` marking the offset of a template, as `name:kind@start-end`, sorted.
   */
  const completionsOf = (template: string) => getTemplateImportPathCompletions(project.path('src/app.html'), template.replace('|', ''), template.indexOf('|'))
    ?.map(({ name, kind, replacementSpan }) => `${name}:${kind}@${replacementSpan!.start}-${replacementSpan!.end}`)
    .sort();

  it('proposes the relative prefixes for the first segment of the path', () => {
    expect(completionsOf(`${imports}|';`)).toEqual(['../:directory@20-20', './:directory@20-20']);
  });

  it('proposes the modules and the directories of the directory written so far', () => {
    project.write('src/ui/button.ts', '');
    project.write('src/ui/button.spec.ts', '');

    expect(completionsOf(`${imports}./|';`)).toEqual(expect.arrayContaining(['app:script@22-22', 'child:script@22-22', 'directives:script@22-22', 'ui/:directory@22-22']));
    expect(completionsOf(`${imports}./ui/bu|';`)).toEqual(['button:script@25-27']);
    expect(completionsOf(`${imports}../|';`)).toEqual(expect.arrayContaining(['src/:directory@23-23']));
  });

  it('proposes nothing for a package path or a directory that does not exist, and leaves to the other completions the offsets not in a path', () => {
    expect(completionsOf(`${imports}@scope/|';`)).toEqual([]);
    expect(completionsOf(`${imports}./missing/|';`)).toEqual([]);
    expect(completionsOf('@import { | } from \'./child\';')).toBeUndefined();
  });
});
