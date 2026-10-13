import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateDefinition, type TemplateDefinition } from './template-definition';
import type { LanguageService } from 'typescript';

const TIMEOUT = 60_000;
const template = [
  '@import { Child } from \'./child\';',
  '@import { Tooltip, Media } from \'./directives\';',
  '@import { Child as C } from \'./child\';',
  '<my-child label="{title}" size="{2}" (picked)="select($event)" (closed)="select(1)" @@tooltip(text="a" (shown)="select(2)") *media(query="q")></my-child>',
  '@for (item of items; track item.id) { {item().name} }',
  '<b (click)="select(3)">x</b>'
].join('\n');

let project: FixtureProject;
let analysis: TemplateAnalysis;

beforeAll(async () => {
  project = createFixtureProject();
  analysis = (await project.analyze(template)).analysis!;
  // Builds the program and type-checks the shim once, so that the tests ask TypeScript about a warm program
  analysis.languageService.getSemanticDiagnostics(analysis.shimPath);
}, TIMEOUT);

afterAll(() => {
  project.dispose();
});

/**
 * Returns the offset of the middle of the nth occurrence of a text of the analyzed template.
 */
const at = (text: string, occurrence = 0): number => {
  let offset = -1;
  for (let i = 0; i <= occurrence; i++) {
    offset = analysis.source.indexOf(text, offset + 1);
  }

  return offset + Math.floor(text.length / 2);
};

/**
 * Returns the text each definition points to.
 */
const textsOf = (definitions: TemplateDefinition[]) => definitions.map(({ fileName, span }) => {
  const text = fileName === analysis.templatePath ? analysis.source : readFileSync(fileName, 'utf-8');
  return [fileName.replace(`${project.root}/`, ''), text.slice(span.start, span.end)];
});

describe('getTemplateDefinition', () => {
  it('leads the name of an imported symbol, and its alias, to its class', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('Child')))).toEqual([['src/child.ts', 'Child']]);
    expect(textsOf(getTemplateDefinition(analysis, at('C }')))).toEqual([['src/child.ts', 'Child']]);
    expect(textsOf(getTemplateDefinition(analysis, at('Media')))).toEqual([['src/directives.ts', 'Media']]);
  });

  it('leads the path of an @import to the imported file', () => {
    expect(getTemplateDefinition(analysis, at('./directives'))).toEqual([{ fileName: project.path('src/directives.ts'), span: { start: 0, end: 0 } }]);
  });

  it('leads the tag name of a component, in the opening and in the closing tag, to its class', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('my-child')))).toEqual([['src/child.ts', 'Child']]);
    expect(textsOf(getTemplateDefinition(analysis, at('my-child', 1)))).toEqual([['src/child.ts', 'Child']]);
  });

  it('leads an attribute bound to a component to its @Property, aliased ones included', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('label')))).toEqual([['src/child.ts', 'label']]);
    expect(textsOf(getTemplateDefinition(analysis, at('size')))).toEqual([['src/child.ts', 'amount']]);
  });

  it('leads an event bound to a component to its @Event, inherited ones included', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('picked')))).toEqual([['src/child.ts', 'picked']]);
    expect(textsOf(getTemplateDefinition(analysis, at('closed')))).toEqual([['src/child-base.ts', 'closed']]);
  });

  it('leads the selector of a directive or structural directive to its class', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('tooltip(')))).toEqual([['src/directives.ts', 'Tooltip']]);
    expect(textsOf(getTemplateDefinition(analysis, at('media(')))).toEqual([['src/directives.ts', 'Media']]);
  });

  it('leads the attributes and events of a directive to its @Property and @Event', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('text')))).toEqual([['src/directives.ts', 'text']]);
    expect(textsOf(getTemplateDefinition(analysis, at('shown')))).toEqual([['src/directives.ts', 'shown']]);
    expect(textsOf(getTemplateDefinition(analysis, at('query')))).toEqual([['src/directives.ts', 'query']]);
  });

  it('leads the identifiers of the expressions and the handlers to their TypeScript definition', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('title')))).toEqual([['src/app.ts', 'title']]);
    expect(textsOf(getTemplateDefinition(analysis, at('items')))).toEqual([['src/app.ts', 'items']]);
    expect(textsOf(getTemplateDefinition(analysis, at('name')))).toEqual([['src/app.ts', 'name']]);
    expect(textsOf(getTemplateDefinition(analysis, at('select')))).toEqual([['src/app.ts', 'select']]);
    // The handler of an event of a native element
    expect(textsOf(getTemplateDefinition(analysis, at('select(3)') - 2))).toEqual([['src/app.ts', 'select']]);
  });

  it('leads a variable declared by the template to its declaration in the template', () => {
    expect(textsOf(getTemplateDefinition(analysis, at('item()')))).toEqual([['src/app.html', 'item']]);
  });

  it('finds nothing outside of a symbol, or for a symbol declared in the shim only', () => {
    expect(getTemplateDefinition(analysis, at('x</b>'))).toEqual([]);
    // `$event` is declared by the shim for the whole event binding
    expect(textsOf(getTemplateDefinition(analysis, at('$event')))).toEqual([['src/app.html', '(picked)="select($event)"']]);
  });

  it('finds nothing for an import whose module cannot be resolved, or when the shim is not in the program', async () => {
    const result = await project.analyze('@import { * as all } from \'./missing\';\n<b>{ title }</b>');
    const { analysis: unresolved } = result;

    expect(getTemplateDefinition(unresolved!, unresolved!.source.indexOf('./missing') + 2)).toEqual([]);
    expect(getTemplateDefinition({ ...unresolved!, shimPath: '/missing.ts' }, unresolved!.source.indexOf('title') + 2)).toEqual([]);
  }, TIMEOUT);

  it('finds nothing for a symbol TypeScript doesn\'t define, or for an implicit variable without alias', async () => {
    const { analysis: loop } = await project.analyze('@for (items; track $index) { { $index() } { 2 } }');

    expect(getTemplateDefinition(loop!, loop!.source.indexOf('$index()') + 2)).toEqual([]);
    expect(getTemplateDefinition(loop!, loop!.source.indexOf('2'))).toEqual([]);
  }, TIMEOUT);


  it('finds nothing when TypeScript has no definition at all', () => {
    const languageService = { ...analysis.languageService, getDefinitionAtPosition: () => undefined } as unknown as LanguageService;

    expect(getTemplateDefinition({ ...analysis, languageService }, at('title'))).toEqual([]);
  });
});
