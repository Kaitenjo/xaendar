import { getImportConflictDiagnostics } from '@xaendar/language-core';
import type { LanguageService } from 'typescript';
import type { Rollup } from 'vite';
import { describeDiagnostic, describeEventCheckDiagnostic } from '../../plugin/plugin-utils/plugin.utils';
import type { TemplateTypeCheck } from '../../types/template-type-check.type';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

/**
 * Reports the diagnostics of the type-check of a template: the events the elements do not declare are warnings, which
 * the binding hears when they bubble up to the element; every other diagnostic is an error, logged, and so is a symbol
 * the template imports under the name of a member of the component, which makes the expressions reading it ambiguous.
 *
 * @param context - The plugin context the warnings are given to.
 * @param state - The plugin state, whose logger reports the errors.
 * @param languageService - The language service holding the shim of the type-check.
 * @param check - The type-check of the template.
 * @returns `true` if the template has errors.
 */
export function reportTemplateDiagnostics(context: Pick<Rollup.PluginContext, 'warn'>, state: Pick<XaendarPluginState, 'logError'>, languageService: LanguageService, check: TemplateTypeCheck): boolean {
  const { templatePath, templateSource, shimPath, bodyLineOffset, typeCheck } = check;
  const diagnostics = languageService.getSemanticDiagnostics(shimPath).slice();
  const conflicts = getImportConflictDiagnostics(languageService, shimPath, bodyLineOffset);
  if (conflicts?.length) {
    diagnostics.push(...conflicts);
  }

  let failed = false;
  for (let i = 0; i < diagnostics.length; i++) {
    const diagnostic = diagnostics[i];
    const warning = describeEventCheckDiagnostic(templateSource, diagnostic, bodyLineOffset, typeCheck);
    if (warning) {
      context.warn(`${templatePath}\n${warning}`);
    } else {
      failed = true;
      state.logError('', `[TypeChecker] Failed to compile template - ${templatePath}\n${describeDiagnostic(templateSource, diagnostic, bodyLineOffset, typeCheck)}`);
    }
  }

  return failed;
}
