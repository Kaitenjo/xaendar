import type { LanguageService } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateCompletions } from './template-completions';

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
