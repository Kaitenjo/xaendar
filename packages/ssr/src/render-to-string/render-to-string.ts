import { entries, isNonEmpty, keys } from '@xaendar/common';
import { _assertRequiredInputs, _stringifyState, _TRANSFER_STATE_ATTRIBUTE, type CustomElement } from '@xaendar/core';
import type { Constructor } from '@xaendar/types';
import type { RenderInputs } from '../types/render-inputs.type';
import type { RenderOptions } from '../types/render-options.type';
import type { ServerOutput } from '../types/server-output.type';
import { _writeEventContract } from '../utils/event-contract/event-contract.util';
import { _createServerRuntime, _runOnServer } from '../utils/server-runtime/server-runtime.util';
import { _getServerRender } from '../utils/server-render-registry/server-render-registry.util';
import { _isClientComponent, _renderComponent, _writeClientRoot } from '../utils/ssr-element/ssr-element.util';

/**
 * The escape of `<` in a string of JSON: a backslash, `u` and the code of the character, `003c`.
 */
const LESS_THAN_ESCAPE = `${String.fromCharCode(92)}u003c`;

/**
 * Renders a component to HTML on the server: its element, with the attributes `@HostProperty` writes on it, and its
 * shadow root as a declarative shadow root (`<template shadowrootmode="open">`), holding its stylesheet and its template,
 * the components it renders rendered the same way. A browser shows it before any script runs.
 *
 * The component runs as in the browser up to its render: it is constructed, its inputs are set by assigning their
 * properties, as code outside Xaendar sets them, then `onInit` runs and its template is rendered, reading each signal
 * once. Its effects, the ones of `this.effect()`, do not run, a component it creates with `createComponent` is not
 * rendered, its events are not listened to and the custom directives of its components are not applied: the browser
 * does it all. The custom directives of a native element are applied up to `onInit`: their properties are set,
 * `onInit` runs and their `@HostProperty` are written, and the content one assigns to `innerHTML` is written as the
 * content of the element. The structural directives run, since they decide what is rendered, and the asynchronous ones
 * are awaited. An expression
 * reading a global of the browser reads it through `globalThis`, `undefined` on the server.
 *
 * Comments mark the dynamic parts of the HTML for the browser: the interpolations, the blocks of `@if`, `@switch` and
 * `@for` with the items of the latter, and the elements structural directives are applied to. The inputs are written
 * into the `data-xd-inputs` attribute of the element, which the browser sets them from, since no template sets the inputs
 * of the root of a page, and the transfer state of `options` into a `<script type="application/json" data-xd-state>`
 * following it, which `getTransferState` reads. Both are written as JSON, which carries `undefined`, `NaN`, `±Infinity`,
 * a `bigint`, a `Date`, a `Map` and a `Set` too.
 *
 * A script following the element, the event contract, records the events of the user until the runtime of the browser is
 * there, which replays them once the components they happened on are hydrated (see `eventContract`).
 *
 * A component declaring `ssr: { render: false }` runs no code: only its empty element is written, with its inputs, and
 * the browser renders it.
 *
 * The server DOM must be installed, with `loadServerDom()` of `@xaendar/ssr/dom`, before the modules of `@xaendar/core`
 * and of the components are evaluated.
 *
 * @example
 * ```ts
 * const html = await renderToString(ProductPageComponent, { productId: '42' }, { state: { 'product:42': product } });
 * ```
 *
 * @param component - The class of the component, decorated with `@WebComponent`.
 * @param inputs - The inputs to set, by the name of their property.
 * @param options - The transfer state of the page, and the nonce of the `Content-Security-Policy` of the response.
 * @returns A promise resolving to the HTML of the component.
 * @throws When the component is not defined, or has no template compiled for the server, when `inputs` leaves out a
 *   required input, when an input or a value of the transfer state cannot be written into the HTML, such as a function, or
 *   when the code of the component throws while it is rendered.
 */
export async function renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>, options?: RenderOptions): Promise<string> {
  const out: ServerOutput = [];
  const state = options?.state;
  const runtime = _createServerRuntime(state);
  let stateScript = '';
  _runOnServer(runtime, () => {
    const tagName = customElements.getName(component);
    if (!tagName) {
      throw new Error(`${component.name} is not defined: decorate it with @WebComponent, and install the server DOM with loadServerDom() before importing its module`);
    }

    const definition = _getServerRender(component);
    const clientOnly = _isClientComponent(component);
    if (!definition && !clientOnly) {
      throw new Error(`${component.name} has no template compiled for the server: build its module with the Vite plugin of @xaendar/build-tools in the server environment`);
    }

    _assertRequiredInputs(component, inputs ? new Set(keys(inputs)) : undefined, 'the inputs of renderToString');
    // Serialized first: a value the HTML cannot carry fails before any code of the component runs
    const serializedInputs = inputs && isNonEmpty(inputs) ? _stringifyState(inputs, 'inputs') : undefined;
    const serializedState = state && isNonEmpty(state) ? _stringifyState(state, 'state') : undefined;
    if (clientOnly) {
      _writeClientRoot(out, tagName, component, serializedInputs);
    } else {
      _renderComponent<Component>(out, tagName, component, definition!, element => {
        if (inputs) {
          const _entries = entries(inputs);
          for (let i = 0; i < _entries.length; i++) {
            const [name, value] = _entries[i];
            (element as unknown as { [name]: typeof value })[name] = value;
          }
        }

        return serializedInputs;
      });
    }

    out.push(`</${tagName}>`);

    if (serializedState) {
      // `<` written as an escape of JSON, so that the state cannot end the script early
      stateScript = `<script type="application/json" ${_TRANSFER_STATE_ATTRIBUTE}>${serializedState.replace(/</g, LESS_THAN_ESCAPE)}</script>`;
    }
  });

  const html = await flatten(out);
  // Written once the page is rendered, when the events of the components of its asynchronous parts are known too
  return `${html}${_writeEventContract(runtime.events, options?.nonce)}${stateScript}`;
}

/**
 * Joins the output of the rendering into its HTML, waiting for the parts rendered later.
 *
 * @param out - The output.
 * @returns A promise resolving to the HTML.
 */
async function flatten(out: ServerOutput): Promise<string> {
  let html = '';
  for (let i = 0; i < out.length; i++) {
    const part = out[i];
    html = `${html}${typeof part === 'string' ? part : await flatten(await part)}`;
  }

  return html;
}
