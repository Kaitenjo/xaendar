import type { WebComponentError } from '@xaendar/compiler';

/**
 * A problem of a component file, on its position: an error the build reports, or a warning it reports without failing.
 */
export type ComponentDiagnostic = WebComponentError & {
  /**
   * Set on a warning: an input named like an attribute every element reflects (see `findReflectedInputs`).
   */
  readonly warning?: true;
};
