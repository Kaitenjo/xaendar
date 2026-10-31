import type { CustomElement } from '@xaendar/core';
import type { Constructor } from '@xaendar/types';
import type { RenderInputs } from '../types/render-inputs.type';
import type { ServerOutput } from '../types/server-output.type';
import { _runOnServer } from '../utils/server-runtime/server-runtime.util';
import { _getServerRender } from '../utils/server-render-registry/server-render-registry.util';
import { _renderComponent } from '../utils/ssr-element/ssr-element.util';
import { entries } from '@xaendar/common';

/**
 * Renders a component to HTML on the server: its element, with the attributes `@HostProperty` writes on it, and its
 * shadow root as a declarative shadow root (`<template shadowrootmode="open">`), holding its stylesheet and its template,
 * the components it renders rendered the same way. A browser shows it before any script runs.
 *
 * The component runs as in the browser up to its render: it is constructed, its inputs are set by assigning their
 * properties, as code outside Xaendar sets them, then `onInit` runs and its template is rendered, reading each signal
 * once. Its effects, the ones of `this.effect()`, do not run, a component it creates with `createComponent` is not
 * rendered, its events are not listened to and its custom directives are not applied: the browser does it all. The
 * structural directives run, since they decide what is rendered, and the asynchronous ones are awaited. An expression
 * reading a global of the browser reads it through `globalThis`, `undefined` on the server.
 *
 * The server DOM must be installed, with `loadServerDom()` of `@xaendar/ssr/dom`, before the modules of `@xaendar/core`
 * and of the components are evaluated.
 *
 * @example
 * ```ts
 * const html = await renderToString(ProductPageComponent, { productId: '42' });
 * ```
 *
 * @param component - The class of the component, decorated with `@WebComponent`.
 * @param inputs - The inputs to set, by the name of their property.
 * @returns A promise resolving to the HTML of the component.
 * @throws When the component is not defined, or has no template compiled for the server, or when its code throws while
 *   it is rendered.
 */
export async function renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>): Promise<string> {
  const out: ServerOutput = [];
  _runOnServer(() => {
    const tagName = customElements.getName(component);
    if (!tagName) {
      throw new Error(`${component.name} is not defined: decorate it with @WebComponent, and install the server DOM with loadServerDom() before importing its module`);
    }

    const definition = _getServerRender(component);
    if (!definition) {
      throw new Error(`${component.name} has no template compiled for the server: build its module with the Vite plugin of @xaendar/build-tools in the server environment`);
    }

    _renderComponent(out, tagName, component, definition, element => {
      if (inputs) {
        const _entries = entries(inputs);
        for (let i = 0; i < _entries.length; i++) {
          const [name, value] = _entries[i];
          (element as unknown as { [name]: typeof value })[name] = value;
        }
      }
    });
    out.push(`</${tagName}>`);
  });

  return flatten(out);
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
