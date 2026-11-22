import { getImportConflictDiagnostics } from '@xaendar/language-core';
import type { VoidFunction } from '@xaendar/types';
import type { LanguageService } from 'typescript';
import { describeDiagnostic, describeEventCheckDiagnostic } from '../../plugin/plugin-utils/plugin.utils';
import type { TemplateTypeCheck } from '../../types/template-type-check.type';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

/**
 * Reports the diagnostics of the type-check of a template: the events the elements do not declare are warnings, which
 * the binding hears when they bubble up to the element; every other diagnostic is an error, logged, and so is a symbol
 * the template imports under the name of a member of the component, which makes the expressions reading it ambiguous.
 *
 * @param warn - Gives a warning, e.g. to the plugin context.
 * @param state - The plugin state, whose logger reports the errors.
 * @param languageService - The language service holding the shim of the type-check.
 * @param check - The type-check of the template.
 * @returns The messages of the errors logged, `undefined` when the template has none.
 */
export function reportTemplateDiagnostics(warn: VoidFunction<[message: string]>, state: Pick<XaendarPluginState, 'logError'>, languageService: LanguageService, check: TemplateTypeCheck): string[] | undefined {
  const { templatePath, templateSource, shimPath, bodyLineOffset, typeCheck } = check;
  const diagnostics = languageService.getSemanticDiagnostics(shimPath).slice();
  const conflicts = getImportConflictDiagnostics(languageService, shimPath, bodyLineOffset);
  if (conflicts?.length) {
    diagnostics.push(...conflicts);
  }

  let errors: string[] | undefined;
  for (let i = 0; i < diagnostics.length; i++) {
    const diagnostic = diagnostics[i];
    const warning = describeEventCheckDiagnostic(templateSource, diagnostic, bodyLineOffset, typeCheck);
    if (warning) {
      warn(`${templatePath}\n${warning}`);
    } else {
      const error = `[TypeChecker] Failed to compile template - ${templatePath}\n${describeDiagnostic(templateSource, diagnostic, bodyLineOffset, typeCheck)}`;
      state.logError('', error);
      errors ? errors.push(error) : errors = [error];
    }
  }

  return errors;
}
