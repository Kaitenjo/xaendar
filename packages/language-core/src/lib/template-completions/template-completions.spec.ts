import type { LanguageService } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateBindingCompletions, getTemplateCompletions } from './template-completions';

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
