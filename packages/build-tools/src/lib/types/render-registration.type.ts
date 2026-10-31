/**
 * How a component registers what it renders with, as `injectTemplate` writes it.
 */
export type RenderRegistration = {
  /**
   * The runtime function registering the render function and the stylesheet.
   */
  readonly define: string;
  /**
   * The package exporting it.
   */
  readonly module: string;
  /**
   * The export of the style module holding the stylesheet.
   */
  readonly styleExport: string;
};