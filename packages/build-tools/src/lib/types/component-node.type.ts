import type { ComponentMetadata } from '@xaendar/compiler';
import type { ComponentUsage } from '@xaendar/language-core';

/**
 * A component of a project, as the analysis of the static components reads it.
 */
export type ComponentNode = {
  /**
   * The metadata of the component.
   */
  readonly metadata: ComponentMetadata;
  /**
   * The path of the module declaring it.
   */
  readonly file: string;
  /**
   * The path of its template.
   */
  readonly templatePath: string;
  /**
   * The components its template renders.
   */
  readonly usages: readonly ComponentUsage[];
  /**
   * What keeps it in the bundle of the browser, `undefined` while it is static.
   */
  logic: string | undefined;
  /**
   * Whether the browser may create it instead of adopting the HTML of the server: it then creates every component its
   * template renders too.
   */
  created: boolean;
};
