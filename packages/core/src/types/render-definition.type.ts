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
   * The stylesheets adopted by the shadow root of the component, in their order: the styles of the project, then the
   * ones of `styleUrl`, those of empty files left out. `undefined` when it adopts none.
   */
  readonly styleSheets?: readonly CSSStyleSheet[];
};
