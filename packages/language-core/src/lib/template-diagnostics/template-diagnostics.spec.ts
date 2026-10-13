import { createSourceFile, type Diagnostic, DiagnosticCategory, type LanguageService, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TemplateAnalysisResult } from '../template-analysis/template-analysis';
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
      getSemanticDiagnostics: () => [diagnostic(shimFile, 0), diagnostic(undefined)]
    } as unknown as LanguageService;

    expect(getTemplateDiagnostics({ analysis: { ...analysis!, languageService }, error: undefined, ast: analysis!.ast })).toEqual([
      { span: { start: 1, end: 3 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 },
      { span: { start: 0, end: 0 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 },
      { span: { start: 0, end: 0 }, message: 'chain\n  next', category: DiagnosticCategory.Warning, code: 1 }
    ]);
  }, TIMEOUT);
});
