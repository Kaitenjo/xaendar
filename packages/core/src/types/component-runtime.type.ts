import type { effect } from '../signals/effect/effect';
import type { _createComponent } from '../utils/create-component/create-component.util';

/**
 * How the components and the custom directives create what is bound to their lifecycle: the effects of
 * `CustomElement.effect` and of `CustomDirective.effect`, and the components of their `createComponent`. The one of the
 * browser is the default: the server rendering replaces it while it runs the code of the components, so that an effect
 * does not run and a component is not rendered into a document the server does not have.
 */
export type _ComponentRuntime = {
  /**
   * Creates an effect, returning the function disposing it.
   */
  readonly effect: typeof effect;
  /**
   * Creates a component bound to the context its owner returns.
   */
  readonly createComponent: typeof _createComponent;
};
