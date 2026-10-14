import type { LanguageService, QuickInfo } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateHover } from './template-hover';

const TIMEOUT = 60_000;
const template = [
  '@import { Child } from \'./child\';',
  '@import { Tooltip } from \'./directives\';',
  '<my-child label="{title}" (closed)="select(1)" @@tooltip(text="a" (shown)="select(2)")></my-child>',
  '@for (item of items; track item.id) { {item().name} }'
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
 * Returns a copy of the analysis whose language service answers a quick info.
 */
const withQuickInfo = (quickInfo: Partial<QuickInfo> | undefined): TemplateAnalysis => ({
  ...analysis,
  languageService: { ...analysis.languageService, getQuickInfoAtPosition: () => quickInfo } as unknown as LanguageService
});

describe('getTemplateHover', () => {
  it('shows the JSDoc of the class on the tag name of a component, in the opening and in the closing tag', () => {
    const hover = getTemplateHover(analysis, at('my-child'));

    expect(hover?.contents).toContain('class Child');
    expect(hover?.contents).toContain('A child component.');
    expect(analysis.source.slice(hover!.span.start, hover!.span.end)).toBe('my-child');
    expect(getTemplateHover(analysis, at('my-child', 1))?.contents).toContain('A child component.');
  });

  it('shows the JSDoc of the class on the selector of a directive, and on the name of an imported symbol', () => {
    expect(getTemplateHover(analysis, at('tooltip('))?.contents).toContain('Shows a tooltip.');
    expect(getTemplateHover(analysis, at('Child'))?.contents).toContain('A child component.');
  });

  it('shows the JSDoc of the @Property on an attribute, with its tags', () => {
    const { contents } = getTemplateHover(analysis, at('label'))!;

    expect(contents).toContain('(accessor) Child.label: InputSignal<string>');
    expect(contents).toContain('The text of the child.');
    expect(contents).toContain('*@example* — <my-child label="a" />');
  });

  it('shows the JSDoc of the @Event on an event, inherited ones included', () => {
    expect(getTemplateHover(analysis, at('closed'))?.contents).toContain('Emitted when the child is closed.');
  });

  it('shows what TypeScript knows about the identifiers of the expressions', () => {
    const hover = getTemplateHover(analysis, at('title'));

    expect(hover?.contents).toContain('title: string');
    expect(hover?.contents).toContain('The title of the page.');
    expect(analysis.source.slice(hover!.span.start, hover!.span.end)).toBe('title');
    expect(getTemplateHover(analysis, at('select'))?.contents).not.toContain('\n\n\n');
    expect(getTemplateHover(analysis, at('item()'))?.contents).toContain('item');
  });

  it('shows nothing on the path of an @import, outside of a symbol, or when the declaration is unknown', () => {
    expect(getTemplateHover(analysis, at('./directives'))).toBeUndefined();
    expect(getTemplateHover(analysis, analysis.source.indexOf('\n@for'))).toBeUndefined();
    expect(getTemplateHover(withQuickInfo(undefined), at('my-child'))).toBeUndefined();
    expect(getTemplateHover(withQuickInfo(undefined), at('title'))).toBeUndefined();
  });

  it('shows nothing when the shim is not in the program, or the symbol is not mapped onto the template', () => {
    expect(getTemplateHover({ ...analysis, shimPath: '/missing.ts' }, at('title'))).toBeUndefined();
    expect(getTemplateHover(withQuickInfo({ displayParts: [], textSpan: { start: 0, length: 1 } }), at('title'))).toBeUndefined();
  });

  it('writes the tags without text, and quick infos without documentation or tags', () => {
    const textSpan = { start: 0, length: 0 };
    const displayParts = [{ text: 'foo', kind: 'text' }];

    expect(getTemplateHover(withQuickInfo({ displayParts, textSpan, tags: [{ name: 'deprecated' }] }), at('my-child'))?.contents).toBe('```ts\nfoo\n```\n\n*@deprecated*');
    expect(getTemplateHover(withQuickInfo({ displayParts, textSpan }), at('my-child'))?.contents).toBe('```ts\nfoo\n```');
  });
});
