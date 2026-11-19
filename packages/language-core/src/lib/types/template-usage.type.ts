import type { ComponentUsage } from './component-usage.type';

/**
 * What a template needs from the browser, as the analysis of the static components reads it (see `getTemplateUsage`).
 */
export type TemplateUsage = {
  /**
   * What the template does in the browser, for the report of the build, `undefined` when it does nothing.
   */
  readonly logic: string | undefined;
  /**
   * The components the template renders, one entry per element.
   */
  readonly components: readonly ComponentUsage[];
};
