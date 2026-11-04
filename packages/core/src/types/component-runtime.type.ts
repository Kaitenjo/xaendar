import type { effect } from '../signals/effect/effect';
import type { _createComponent } from '../utils/create-component/create-component.util';
import type { _readPageTransferState } from '../utils/transfer-state/transfer-state.util';

/**
 * How the components and the custom directives create what is bound to their lifecycle: the effects of
 * `CustomElement.effect` and of `CustomDirective.effect`, and the components of their `createComponent`, and where
 * `getTransferState` reads the transfer state. The one of the browser is the default: the server rendering replaces it
 * while it runs the code of the components, so that an effect does not run, a component is not rendered into a document
 * the server does not have, and the transfer state is the one of the page being rendered.
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
  /**
   * Reads a value of the transfer state.
   */
  readonly getTransferState: typeof _readPageTransferState;
};
