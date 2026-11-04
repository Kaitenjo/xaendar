import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject } from '../testing/fixture-project/fixture-project.utils';
import type { FixtureProject } from '../types/fixture-project.type';
import { findUnusedImports, organizeTemplateImports, removeTemplateImport } from './template-imports';

const TIMEOUT = 60_000;
let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

const imports = '@import { Child } from \'./child\';\n@import { Tooltip, Media as M } from \'./directives\';\n';

/**
 * Analyzes a template and returns the unused imports as the text of the specifier they are reported on.
 */
const unusedIn = async (source: string) => {
  const { analysis } = await project.analyze(source);
  return findUnusedImports(analysis!)?.map(({ span, name }) => [source.slice(span.start, span.end), name]);
};

describe('findUnusedImports', () => {
  it('finds the components and directives no element and no directive of the template is', async () => {
    expect(await unusedIn(`${imports}<my-child label="a"></my-child>`)).toEqual([['Tooltip', 'Tooltip'], ['Media as M', 'M']]);
  }, TIMEOUT);

  it('counts a component used as an element, and a directive or structural directive used anywhere', async () => {
    expect(await unusedIn(`${imports}<my-child label="a"><b @@tooltip>x</b></my-child>`)).toEqual([['Media as M', 'M']]);
    expect(await unusedIn(`${imports}<b @@tooltip @if (true) { @@media }>x</b>`)).toEqual([['Child', 'Child']]);
    expect(await unusedIn(`${imports}@for (item of items; track item().id) { <my-child label="a" @@tooltip @@media /> }`)).toBeUndefined();
  }, TIMEOUT);

  it('finds every import of a template using none', async () => {
    expect(await unusedIn(`${imports}<p>text</p>`)).toEqual([['Child', 'Child'], ['Tooltip', 'Tooltip'], ['Media as M', 'M']]);
  }, TIMEOUT);

  it('finds nothing in a template without imports', async () => {
    expect(await unusedIn('<p>text</p>')).toBeUndefined();
  }, TIMEOUT);
});

describe('removeTemplateImport', () => {
  it('computes how to remove an unused import, keeping the others', async () => {
    const source = `${imports}<my-child label="a" @@tooltip></my-child>`;
    const { analysis } = await project.analyze(source);
    const [unused] = findUnusedImports(analysis!)!;
    const change = removeTemplateImport(source, unused)!;

    expect(`${source.slice(0, change.span.start)}${change.newText}${source.slice(change.span.end)}`).toBe('@import { Child } from \'./child\';\n@import { Tooltip } from \'./directives\';\n<my-child label="a" @@tooltip></my-child>');
  }, TIMEOUT);
});

describe('organizeTemplateImports', () => {
  const apply = (source: string, change: ReturnType<typeof organizeTemplateImports>) => (change ? `${source.slice(0, change.span.start)}${change.newText}${source.slice(change.span.end)}` : source);

  it('removes the unused imports and sorts the others', async () => {
    const source = '@import { Tooltip, Media as M } from \'./directives\';\n@import { Child } from \'./child\';\n<my-child label="a" @@tooltip></my-child>';
    const { analysis } = await project.analyze(source);

    expect(apply(source, organizeTemplateImports(source, analysis))).toBe('@import { Child } from \'./child\';\n@import { Tooltip } from \'./directives\';\n<my-child label="a" @@tooltip></my-child>');
  }, TIMEOUT);

  it('only sorts when the analysis is not the one of the current source, or there is none', async () => {
    const analyzed = `${imports}<my-child label="a"></my-child>`;
    const { analysis } = await project.analyze(analyzed);
    const source = '@import { Tooltip, Media as M } from \'./directives\';\n@import { Child } from \'./child\';\n<my-child label="a"></my-child><b';

    const sorted = '@import { Child } from \'./child\';\n@import { Media as M, Tooltip } from \'./directives\';\n<my-child label="a"></my-child><b';
    expect(apply(source, organizeTemplateImports(source, analysis))).toBe(sorted);
    expect(apply(source, organizeTemplateImports(source, undefined))).toBe(sorted);
  }, TIMEOUT);

  it('changes nothing when the imports are organized', async () => {
    const source = '@import { Child } from \'./child\';\n<my-child label="a"></my-child>';
    const { analysis } = await project.analyze(source);

    expect(organizeTemplateImports(source, analysis)).toBeUndefined();
  }, TIMEOUT);
});
