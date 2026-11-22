import type { TypeCheckResult } from '@xaendar/compiler';

/**
 * The type-check of the template of a component, whose shim the language service holds: run by the `transform` hook,
 * or, in a build, by the `buildEnd` hook, together with the ones of every other component.
 */
export type TemplateTypeCheck = {
  /**
   * The path of the file declaring the component.
   */
  readonly componentPath: string;
  /**
   * The path of the template.
   */
  readonly templatePath: string;
  /**
   * The source of the template, which the diagnostics point to.
   */
  readonly templateSource: string;
  /**
   * The path of the shim checking the template against the component.
   */
  readonly shimPath: string;
  /**
   * The line of the shim the body of the type-check starts at.
   */
  readonly bodyLineOffset: number;
  /**
   * The type-check code of the template, mapping the lines of the shim back to the template.
   */
  readonly typeCheck: TypeCheckResult;
};
