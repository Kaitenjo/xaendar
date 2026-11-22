import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@xaendar/language-core', () => ({
  getImportConflictDiagnostics: vi.fn()
}));

vi.mock('../../plugin/plugin-utils/plugin.utils', () => ({
  describeDiagnostic: vi.fn((_source: string, diagnostic: string) => `described ${diagnostic}`),
  describeEventCheckDiagnostic: vi.fn((_source: string, diagnostic: string) => diagnostic.startsWith('event') ? `warning ${diagnostic}` : undefined)
}));

import { getImportConflictDiagnostics } from '@xaendar/language-core';
import type { LanguageService } from 'typescript';
import type { TemplateTypeCheck } from '../../types/template-type-check.type';
import { reportTemplateDiagnostics } from './template-type-check.utils';

/**
 * The type-check of the template of a fixture component.
 */
const CHECK: TemplateTypeCheck = {
  componentPath: '/src/foo.xd.component.ts',
  templatePath: '/src/foo.xd.component.html',
  templateSource: '<p>{ x }</p>',
  shimPath: '/src/foo.xd.component.ts.__typecheck__.ts',
  bodyLineOffset: 3,
  typeCheck: { text: '', mappingTable: new Map() }
};

/**
 * Builds a language service whose shim reports some diagnostics.
 *
 * @param diagnostics - The diagnostics, named for the test.
 * @returns The language service.
 */
const languageServiceWith = (...diagnostics: string[]) => ({ getSemanticDiagnostics: vi.fn(() => diagnostics) }) as unknown as LanguageService;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getImportConflictDiagnostics).mockReturnValue(undefined);
});

describe('reportTemplateDiagnostics', () => {
  it('reports nothing for a template without diagnostics', () => {
    const context = { warn: vi.fn() };
    const state = { logError: vi.fn() };
    const languageService = languageServiceWith();

    expect(reportTemplateDiagnostics(context, state, languageService, CHECK)).toBe(false);
    expect(languageService.getSemanticDiagnostics).toHaveBeenCalledWith(CHECK.shimPath);
    expect(getImportConflictDiagnostics).toHaveBeenCalledWith(languageService, CHECK.shimPath, 3);
    expect(context.warn).not.toHaveBeenCalled();
    expect(state.logError).not.toHaveBeenCalled();
  });

  it('warns about the events the elements do not declare, without failing', () => {
    const context = { warn: vi.fn() };
    const state = { logError: vi.fn() };

    expect(reportTemplateDiagnostics(context, state, languageServiceWith('event-1'), CHECK)).toBe(false);
    expect(context.warn).toHaveBeenCalledWith('/src/foo.xd.component.html\nwarning event-1');
  });

  it('logs every other diagnostic, and the import conflicts, as errors', () => {
    const context = { warn: vi.fn() };
    const state = { logError: vi.fn() };
    vi.mocked(getImportConflictDiagnostics).mockReturnValue(['conflict' as never]);

    expect(reportTemplateDiagnostics(context, state, languageServiceWith('error-1', 'event-1'), CHECK)).toBe(true);
    expect(state.logError).toHaveBeenCalledWith('', '[TypeChecker] Failed to compile template - /src/foo.xd.component.html\ndescribed error-1');
    expect(state.logError).toHaveBeenCalledWith('', '[TypeChecker] Failed to compile template - /src/foo.xd.component.html\ndescribed conflict');
    expect(context.warn).toHaveBeenCalledOnce();
  });
});
