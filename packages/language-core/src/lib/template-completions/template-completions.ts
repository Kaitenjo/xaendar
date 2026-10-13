import { resolveShimPosition } from '@xaendar/compiler';
import type { CompletionEntry } from 'typescript';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';

/**
 * A completion proposed in a template.
 */
export type TemplateCompletion = Pick<CompletionEntry, 'name' | 'kind' | 'sortText'>;

/**
 * Asks TypeScript the completions at an offset of a template, through the position of the shim it is mapped onto:
 * the members of the component, of an object, the variables of the template in scope.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none if the offset is not in an expression.
 */
export function getTemplateCompletions({ typeCheck, languageService, shimPath, bodyLineOffset }: TemplateAnalysis, offset: number): TemplateCompletion[] {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (!shimPosition || !shimFile) {
    return [];
  }

  const position = shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character);
  const completions = languageService.getCompletionsAtPosition(shimPath, position, {});
  return completions?.entries.map(({ name, kind, sortText }) => ({ name, kind, sortText })) ?? [];
}
