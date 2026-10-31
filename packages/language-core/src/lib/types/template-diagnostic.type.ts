import type { Span } from '@xaendar/compiler';
import type { DiagnosticCategory } from 'typescript';

/**
 * A problem found in a template, located in the template itself.
 */
export type TemplateDiagnostic = {
  /**
   * The span of the template the problem refers to.
   */
  readonly span: Span;
  /**
   * The description of the problem.
   */
  readonly message: string;
  /**
   * The severity of the problem.
   */
  readonly category: DiagnosticCategory;
  /**
   * The TypeScript error code, for the problems found by type-checking the template.
   */
  readonly code?: number;
  /**
   * Set for what the template doesn't need (an import it never uses): the editor shows it faded, not as a problem.
   */
  readonly unnecessary?: true;
};
