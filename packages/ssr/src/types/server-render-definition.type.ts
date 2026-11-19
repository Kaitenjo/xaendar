import type { ServerRenderFunction } from './server-render-function.type';

/**
 * What the server renders a component with.
 */
export type ServerRenderDefinition = {
  /**
   * The function rendering the template of the component.
   */
  readonly render: ServerRenderFunction;
  /**
   * The CSS of the stylesheet of the component, written in a `<style>` of its shadow root, if it declares any style.
   */
  readonly css?: string;
};
