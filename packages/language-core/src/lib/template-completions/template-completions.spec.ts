import type { LanguageService } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateBindingCompletions, getTemplateCompletions, getTemplateImportCompletions, getTemplateImportPathCompletions, getTemplateSelectorCompletions, getTemplateSourceBindingCompletions } from './template-completions';

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
