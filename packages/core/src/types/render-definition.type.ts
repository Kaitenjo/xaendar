import type { RenderFunction } from './render-function.type';

/**
 * Rendering information registered for a component class.
 */
export type RenderDefinition = {
  /**
   * Compiler-generated render function of the component template.
   */
  readonly render: RenderFunction;
  /**
   * Stylesheet adopted by the component shadow root, if the component declares any style.
   */
  readonly styleSheet?: CSSStyleSheet;
};
