import { _TRANSFER_STATE_ATTRIBUTE } from '../../costants';
import { _getComponentRuntime } from '../component-runtime/component-runtime.util';
import { _parseState } from '../state-serialization/state-serialization.util';

/**
 * The transfer state each `<script>` of the page holds, read the first time a value is looked up in it.
 */
const pageStates = new WeakMap<Element, Readonly<Record<string, unknown>>>();

/**
 * Returns a value of the transfer state of a page rendered on the server, which the server gives the browser so that it
 * starts from the same data without fetching them again. On the server it is the value of the key in the `state`
 * `renderToString` renders the page with; in the browser, the one the server wrote into the page. The same code reads
 * it on both sides, e.g. in `onInit`.
 *
 * The value is `undefined` when the page was not rendered on the server, or the server did not give the key: the code
 * reading it then loads the data as it would without the server. The values stay in the page until it is reloaded, and
 * every read of a key returns the same value.
 *
 * @example
 * ```ts
 * public onInit(): void {
 *   const product = getTransferState<Product>(`product:${this.productId()}`);
 *   product ? this.product.set(product) : this.load(this.productId());
 * }
 * ```
 *
 * @param key - The key of the value.
 * @returns The value, `undefined` when there is none.
 */
export function getTransferState<Value>(key: string): Value | undefined {
  return _getComponentRuntime().getTransferState(key) as Value | undefined;
}

/**
 * Reads a value of the transfer state the server wrote into the page, in the `<script type="application/json">`
 * elements carrying `data-xd-state`, one per component the server rendered: the first one holding the key gives its
 * value. Outside a browser, where there is no page, there is no value.
 *
 * @param key - The key of the value.
 * @returns The value, `undefined` when there is none.
 */
export function _readPageTransferState(key: string): unknown {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const scripts = document.querySelectorAll(`script[type="application/json"][${_TRANSFER_STATE_ATTRIBUTE}]`);
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    let state = pageStates.get(script);
    if (!state) {
      state = _parseState(script.textContent!) as Record<string, unknown>;
      pageStates.set(script, state);
    }

    if (Object.hasOwn(state, key)) {
      return state[key];
    }
  }

  return undefined;
}
