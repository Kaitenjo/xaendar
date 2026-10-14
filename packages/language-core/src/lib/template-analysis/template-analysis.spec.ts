import { TemplateError } from '@xaendar/compiler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { normalizeFileName } from '../utils/path/path.utils';
import { analyzeCompletionTemplate, analyzeTemplate, invalidateTemplateMetadata, removeTemplateAnalysis, resolveImportCandidates, resolveModuleMetadatas, resolveTemplateImports } from './template-analysis';

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
      normalizeFileName(project.path('src/directives.ts')),
      normalizeFileName(project.path('stubs/core.ts'))
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

  it('keeps the last analysis while the template cannot be parsed, until it is removed', async () => {
    const components = new Map([[project.path('src/app.ts'), ['App']]]);
    const path = project.path('src/stale.html');
    const { analysis } = await analyzeTemplate(path, '<b>{ title }</b>', components);

    const failed = await analyzeTemplate(path, '<b>{ title }</b><div>', components);
    expect(failed.error).toBeInstanceOf(TemplateError);
    expect(failed.analysis).toBe(analysis);
    expect(failed.ast).toBeUndefined();

    removeTemplateAnalysis(path);
    expect((await analyzeTemplate(path, '<div>', components)).analysis).toBeUndefined();
  }, TIMEOUT);

  it('analyzes the version of a template a completion is asked on beside its shim, without keeping it as the last analysis', async () => {
    const components = new Map([[project.path('src/app.ts'), ['App']]]);
    const path = project.path('src/completed.html');
    const { analysis } = await analyzeTemplate(path, '<b>{ title }</b>', components);

    const completion = await analyzeCompletionTemplate(path, '<b>{ items }</b>', components);
    expect(completion!.shimPath).toBe(`${project.path('src/app.ts')}.__completion__.ts`);
    expect(completion!.typeCheck.text).toContain('root.items');
    expect(analysis!.languageService.getProgram()!.getSourceFile(analysis!.shimPath)!.text).toContain('root.title');
    expect((await analyzeTemplate(path, '<div>', components)).analysis).toBe(analysis);
    expect(await analyzeCompletionTemplate(path, '<div>', components)).toBeUndefined();
  }, TIMEOUT);

  it('analyzes a template with nodes failing type-checking, collecting the error of each of them', async () => {
    const source = '<my-unknown></my-unknown>\n<b>{ title }</b><my-other></my-other>';
    const { analysis, error, ast } = await project.analyze(source);

    expect(error).toBeUndefined();
    expect(analysis!.source).toBe(source);
    expect(ast).toBe(analysis!.ast);
    expect(analysis!.errors.map(failure => (failure as TemplateError).detail)).toEqual([
      'my-unknown selector is not associated to any WebComponent imported in the template, nor declared in customElements',
      'my-other selector is not associated to any WebComponent imported in the template, nor declared in customElements'
    ]);
    expect(analysis!.errors.map(failure => (failure as TemplateError).span.start)).toEqual([0, 42]);
    expect(analysis!.typeCheck.text).toContain('root.title');
  }, TIMEOUT);

  it('reports a symbol that cannot be imported on its name, and goes on with the others', async () => {
    const { analysis, error } = await project.analyze('@import { Missing, Child } from \'./child\';');

    expect(error).toBeUndefined();
    expect(analysis!.errors).toHaveLength(1);
    expect(analysis!.errors[0]).toBeInstanceOf(TemplateError);
    expect((analysis!.errors[0] as TemplateError).span).toEqual({ start: 10, end: 17 });
    expect(analysis!.errors[0].message).toBe('Class "Missing" was not found in the import from ./child');
    expect(analysis!.imports.map(({ metadata }) => metadata.className)).toEqual(['Child']);
  }, TIMEOUT);

  it('reports a module that cannot be found on its path, even when only a namespace is imported from it, and goes on with the others', async () => {
    const { analysis } = await project.analyze('@import { Child } from \'./missing\';\n@import { Tooltip } from \'./directives\';');

    expect(analysis!.errors).toHaveLength(1);
    expect(analysis!.errors[0]).toBeInstanceOf(TemplateError);
    expect((analysis!.errors[0] as TemplateError).span).toEqual({ start: 24, end: 33 });
    expect(analysis!.errors[0].message).toBe('Cannot find module "./missing"');
    expect(analysis!.imports.map(({ metadata }) => metadata.className)).toEqual(['Tooltip']);

    const namespace = await project.analyze('@import { * as all } from "./missing";');
    expect((namespace.analysis!.errors[0] as TemplateError).span).toEqual({ start: 27, end: 36 });
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
    const { analysis } = await project.analyze('@import { Duplicated } from \'./duplicated\';');

    expect((analysis!.errors[0] as TemplateError).span).toEqual({ start: 10, end: 20 });
    expect(analysis!.errors[0].message).toContain('A property identified by name b was already defined');
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

describe('resolveTemplateImports', () => {
  it('resolves the symbols imported by the source, aliases and default imports included, even if the template cannot be parsed', async () => {
    const source = [
      '@import { Child, Media as M, * as all, Missing } from \'./child\';',
      '@import { Tooltip } from "./directives"',
      '@import { default as Media } from \'./directives\';',
      '<my-child'
    ].join('\n');
    const metadatas = await resolveTemplateImports(project.path('src/app.html'), source);

    expect(metadatas.map(({ selector }) => selector)).toEqual(['my-child', 'tooltip', 'media']);
  }, TIMEOUT);

  it('resolves nothing for a source without imports', async () => {
    expect(await resolveTemplateImports(project.path('src/app.html'), '<b></b>')).toEqual([]);
  }, TIMEOUT);
});

describe('resolveModuleMetadatas', () => {
  it('resolves the components and directives declared in a module, none if it cannot be resolved', async () => {
    const metadatas = await resolveModuleMetadatas(project.path('src/app.html'), './directives');

    expect(metadatas?.map(({ className }) => className)).toEqual(['Tooltip', 'Media']);
    expect(await resolveModuleMetadatas(project.path('src/app.html'), './missing')).toBeUndefined();
  }, TIMEOUT);
});

describe('resolveImportCandidates', () => {
  it('resolves the components and directives of the project, the component of the template excluded', async () => {
    const candidates = await resolveImportCandidates(project.path('src/app.html'));

    expect(candidates!.map(({ fileName, metadata }) => [fileName, metadata.className])).toEqual([
      [project.path('src/child.ts'), 'Child'],
      [project.path('src/directives.ts'), 'Tooltip'],
      [project.path('src/directives.ts'), 'Media']
    ]);
  }, TIMEOUT);

  it('resolves nothing when the project declares nothing but the component of the template, or nothing at all', async () => {
    const other = createFixtureProject();
    other.write('src/child.ts', 'export {};\n');
    other.write('src/directives.ts', 'export {};\n');
    expect(await resolveImportCandidates(other.path('src/app.html'))).toBeUndefined();

    other.write('src/app.ts', 'export {};\n');
    expect(await resolveImportCandidates(other.path('src/app.html'))).toBeUndefined();
    other.dispose();
  }, TIMEOUT);
});
