/**
 * Inputs needed to compile a template module, decoded from its resolved id.
 */
export type TemplateModuleRequest = {
  /**
   * Absolute path of the template file.
   */
  readonly templatePath: string;
  /**
   * Signal members of the component classes sharing this template module.
   */
  readonly signals: string[];
};
