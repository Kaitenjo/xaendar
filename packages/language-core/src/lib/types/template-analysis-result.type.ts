import type { ASTNode } from '@xaendar/compiler';
import type { TemplateAnalysis } from './template-analysis.type';

/**
 * The result of an analysis of a template, successful or not.
 */
export type TemplateAnalysisResult = {
  /**
   * The analysis of the template: the current one, or the last successful one when the template cannot be compiled
   * (e.g. while the user is typing), so that the navigation keeps working. `undefined` if the template never compiled.
   */
  readonly analysis: TemplateAnalysis | undefined;
  /**
   * The error preventing the template from being compiled, if any.
   */
  readonly error: Error | undefined;
  /**
   * The top-level nodes of the template when it could be parsed, even if it failed type-checking afterwards.
   */
  readonly ast: readonly ASTNode[] | undefined;
};
