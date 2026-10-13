import { ASTNodeType, TemplateError } from '@xaendar/compiler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { normalizeFileName } from '../utils/path/path.utils';
import { analyzeTemplate, invalidateTemplateMetadata, removeTemplateAnalysis } from './template-analysis';

const TIMEOUT = 60_000;
let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

describe('analyzeTemplate', () => {
  it('parses the template, resolves its imports and registers its type-check shim', async () => {
    const source = '@import { Child } from \'./child\';\n@import { Tooltip, Media as M } from \'./directives\';\n<my-child label="{title}"></my-child>';
    const { analysis, error, ast } = await project.analyze(source);

    expect(error).toBeUndefined();
    expect(ast).toBe(analysis!.ast);
    expect(analysis!.source).toBe(source);
    expect(analysis!.imports.map(({ specifier, metadata }) => [specifier.local, metadata.className])).toEqual([['Child', 'Child'], ['Tooltip', 'Tooltip'], ['M', 'Media']]);
    expect(analysis!.metadatas.map(({ selector }) => selector)).toEqual(['my-child', 'tooltip', 'media']);
    expect(analysis!.typeCheck.text).toContain('(root.title) satisfies');
    expect(analysis!.shimPath).toBe(`${project.path('src/app.ts')}.__typecheck__.ts`);
    expect(analysis!.languageService.getProgram()!.getSourceFile(analysis!.shimPath)).toBeDefined();
    expect([...analysis!.dependencies].sort()).toEqual([
      normalizeFileName(project.path('src/app.ts')),
      normalizeFileName(project.path('src/child.ts')),
      normalizeFileName(project.path('src/directives.ts'))
    ].sort());
  }, TIMEOUT);

  it('reads the members of the component shadowing a global, and the files declaring its base classes', async () => {
    project.write('src/shadowing.ts', 'import { ChildBase } from \'./child-base\';\nexport class Shadowing extends ChildBase { history = 1; }\nclass Other {}\n');
    const { analysis } = await analyzeTemplate(project.path('src/shadowing.html'), '{ history }', new Map([[project.path('src/shadowing.ts'), ['Shadowing']]]));

    expect(analysis!.typeCheck.text).toContain('root.history;');
    expect(analysis!.dependencies.has(normalizeFileName(project.path('src/child-base.ts')))).toBe(true);
  }, TIMEOUT);

  it('analyzes a template whose component file cannot be read, ignoring the namespace imports', async () => {
    const { analysis, error } = await analyzeTemplate(project.path('src/missing.html'), '@import { * as all } from \'./child\';\n<b></b>', new Map([[project.path('src/missing.ts'), ['Missing']]]));

    expect(error).toBeUndefined();
    expect(analysis!.imports).toEqual([]);
  }, TIMEOUT);

  it('returns the error of a template that cannot be parsed, without analysis when it never compiled', async () => {
    const path = project.path('src/broken.html');
    const { analysis, error, ast } = await analyzeTemplate(path, '<div>', new Map([[project.path('src/app.ts'), ['App']]]));

    expect(error).toBeInstanceOf(TemplateError);
    expect(analysis).toBeUndefined();
    expect(ast).toBeUndefined();
  }, TIMEOUT);

  it('keeps the last successful analysis while the template cannot be compiled, until it is removed', async () => {
    const components = new Map([[project.path('src/app.ts'), ['App']]]);
    const path = project.path('src/stale.html');
    const { analysis } = await analyzeTemplate(path, '<b>{ title }</b>', components);

    const failed = await analyzeTemplate(path, '<my-unknown></my-unknown>', components);
    expect(failed.error).toBeInstanceOf(TemplateError);
    expect(failed.analysis).toBe(analysis);
    // The template could be parsed: its nodes are returned even if it failed type-checking
    expect(failed.ast).toMatchObject([{ type: ASTNodeType.Element, tagName: 'my-unknown' }]);

    removeTemplateAnalysis(path);
    expect((await analyzeTemplate(path, '<my-unknown></my-unknown>', components)).analysis).toBeUndefined();
  }, TIMEOUT);

  it('reports a symbol that cannot be imported on its name', async () => {
    const source = '@import { Missing } from \'./child\';';
    const { error } = await project.analyze(source);

    expect(error).toBeInstanceOf(TemplateError);
    expect((error as TemplateError).span).toEqual({ start: 10, end: 17 });
    expect(error!.message).toBe('Class "Missing" was not found in the import from ./child');
  }, TIMEOUT);

  it('reports a component whose metadata cannot be extracted on its name', async () => {
    project.write('src/duplicated.ts', [
      'import { Property, WebComponent } from \'@xaendar/core\';',
      '@WebComponent({ selector: \'my-duplicated\', templateUrl: \'./duplicated.html\' })',
      'export class Duplicated {',
      '  @Property(0, { alias: \'b\' }) accessor a!: number;',
      '  @Property() accessor b!: number;',
      '}',
      ''
    ].join('\n'));
    const { error } = await project.analyze('@import { Duplicated } from \'./duplicated\';');

    expect((error as TemplateError).span).toEqual({ start: 10, end: 20 });
    expect(error!.message).toContain('A property identified by name b was already defined');
  }, TIMEOUT);

  it('extracts again the metadata of an invalidated file', async () => {
    const source = '@import { Child } from \'./child\';';
    const first = (await project.analyze(source)).analysis!.metadatas[0];

    invalidateTemplateMetadata(project.path('src/child.ts'));

    expect((await project.analyze(source)).analysis!.metadatas[0]).not.toBe(first);
  }, TIMEOUT);

  it('resolves a default import by its local name', async () => {
    const { analysis } = await project.analyze('@import { default as Child } from \'./child\';');

    expect(analysis!.imports.map(({ metadata }) => metadata.className)).toEqual(['Child']);
  }, TIMEOUT);
});
