/**
 * Internal mapping from attribute aliases to property keys.
 */
export const INTERNAL_ALIAS_TO_ATTRIBUTE = 'aliasToAttribute';
/**
 * Internal metadata key holding the selector a web component is registered with (see `WebComponent`).
 */
export const INTERNAL_SELECTOR = 'selector';
/**
 * Internal metadata key holding the host directives a web component is declared with (see `WebComponent`).
 */
export const INTERNAL_HOST_DIRECTIVES = 'hostDirectives';
/**
 * Internal metadata key holding the attributes and the classes a web component or a custom directive binds on its host
 * element (see `HostProperty`).
 */
export const INTERNAL_HOST_PROPERTIES = 'hostProperties';
/**
 * Internal metadata key holding the events a web component or a custom directive listens to on its host element
 * (see `HostEvent`).
 */
export const INTERNAL_HOST_EVENTS = 'hostEvents';
/**
 * Key of the trigger a `@WebComponent` declares in the metadata of its class (see `WebComponentOptions`).
 */
export const INTERNAL_HYDRATE = 'hydrate';
/**
 * Key of the `false` a `@WebComponent` rendering only in the browser declares in the metadata of its class (see
 * `WebComponentOptions`).
 */
export const INTERNAL_RENDER = 'render';
/**
 * Namespace for SVG elements.
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';
/**
 * Namespace for MathML elements.
 */
export const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
/**
 * Key of the internal setter the template runtime invokes to give a directive the
 * element it is applied to, before starting it (see `CustomDirective`).
 */
export const SET_DIRECTIVE_ELEMENT = Symbol('SetDirectiveElement');
/**
 * Key of the internal setter a `CustomElement` invokes to give a host directive the events it exposes, as a map from the
 * name of the event the directive dispatches to the name it is dispatched with on the host (see `CustomDirective`).
 */
export const SET_DIRECTIVE_EVENTS = Symbol('SetDirectiveEvents');
/**
 * Key of the internal method the template runtime invokes to start a directive,
 * once its inputs have been bound (see `CustomDirective`).
 */
export const DIRECTIVE_CONNECT = Symbol('DirectiveConnect');
/**
 * Key of the internal method the template runtime invokes to disconnect a directive,
 * typically when its host element is removed from the DOM.
 */
export const DIRECTIVE_DISCONNECT = Symbol('DirectiveDisconnect');
/**
 * Key of the internal list of callbacks a `CustomElement` invokes each time it is connected, right after the render.
 */
export const CONNECTED_HOOKS = Symbol('ConnectedHooks');
/**
 * Key of the internal list of callbacks a `CustomElement` invokes each time it is disconnected.
 */
export const DISCONNECTED_HOOKS = Symbol('DisconnectedHooks');
/**
 * Key of the method of a `CustomElement` rendered on the server starting its hydration, once the component rendering it
 * has adopted its element and set its inputs, as inserting the element connects a component rendered in the browser.
 */
export const HYDRATE = Symbol('Hydrate');
/**
 * Key of the method of a `CustomElement` telling whether the element still waits for its first render, so that the
 * events on it are not replayed yet: an element that never hydrates does not wait.
 */
export const WAITS_FOR_HYDRATION = Symbol('WaitsForHydration');
/**
 * Key of the brand marking the options `Property.required` passes to the decorator it creates, which tells them apart
 * from a default value (see `Property`).
 */
export const PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND = Symbol('PropertyDecoratorOptionsWithRequiredBrand');
/**
 * The attribute of the element of a component rendered on the server by `renderToString`, holding the inputs it was
 * rendered with (see `_stringifyState`): the browser sets them again before the component renders, since no template
 * sets the inputs of the root of a page (see `CustomElement`).
 */
export const _SERVER_INPUTS_ATTRIBUTE = 'data-xd-inputs';
/**
 * The attribute of the `<script type="application/json">` holding the transfer state of a page rendered on the server
 * (see `_stringifyState`), which `getTransferState` reads in the browser.
 */
export const _TRANSFER_STATE_ATTRIBUTE = 'data-xd-state';
/**
 * The attribute of the element of a component rendered on the server, holding the trigger its `@WebComponent` declares
 * (`idle`, `visible` or `interaction`): the browser hydrates the element once the trigger fires, and `never`, which
 * leaves it as the HTML of the server.
 */
export const _HYDRATE_ATTRIBUTE = 'data-xd-hydrate';
/**
 * The attribute of the element of a component rendering only in the browser, written by the server in place of its shadow
 * root: the element waits to be rendered as one rendered on the server waits to be hydrated, so that the template holding
 * it sets its inputs first.
 */
export const _CLIENT_ATTRIBUTE = 'data-xd-client';
/**
 * The attribute of an element rendered on the server listening to `submit` in its template: the event contract prevents
 * the submission of a form it holds, which would leave the page before the hydration. The other forms are not known to
 * need the runtime, so the browser submits them.
 */
export const _SUBMIT_ATTRIBUTE = 'data-xd-submit';
/**
 * The name of the property of `window` holding the event contract, the script `renderToString` writes into the page (see
 * `_EventContract`).
 */
export const _EVENT_CONTRACT_KEY = '__xdEvents';
/**
 * The events recorded on content rendered on the server waiting for its hydration, whether it has a listener for them or
 * not: they are what fires the `interaction` trigger, which a block without listeners needs too.
 */
export const _RECORDED_EVENTS: readonly string[] = ['click', 'dblclick', 'input', 'change', 'submit', 'keydown', 'keyup', 'focusin', 'focusout'];
/**
 * The text of the comments the server writes around the dynamic parts of the HTML, which the browser adopts the nodes
 * of: each block is opened by `<!--marker-->` (`<!--marker:detail-->` with its detail) and closed by `<!--/marker-->`,
 * where the browser places the anchor of the block. `@xaendar/ssr-compiler`, which depends on no runtime, writes the
 * same ones into the code it generates.
 */
export const _SSR_MARKERS = {
  /**
   * Written before each interpolation, and between two texts following each other, which the parser would join into one
   * text node: `<!---->`.
   */
  text: '',
  /**
   * An `@if`, its detail the index of the branch rendered, none when no branch is: `<!--xd-if:0-->…<!--/xd-if-->`.
   */
  if: 'xd-if',
  /**
   * A `@switch`, its detail the index of the block rendered, `@case` or `@default` in the order they are declared,
   * none when no block is: `<!--xd-switch:1-->…<!--/xd-switch-->`.
   */
  switch: 'xd-switch',
  /**
   * A `@for`, opening its items: `<!--xd-for-->…<!--/xd-for-->`.
   */
  for: 'xd-for',
  /**
   * An item of a `@for`, before its nodes, its detail the key its `track` gives: `n` and the number, or `s` and the
   * string, encoded as a URI component, e.g. `<!--xd-item:n42-->`.
   */
  item: 'xd-item',
  /**
   * An element structural directives are applied to, its detail `1` when it is rendered, `0` otherwise:
   * `<!--xd-s:1--><p>…</p><!--/xd-s-->`.
   */
  structural: 'xd-s',
  /**
   * The content of a `@hydrate`, which the browser adopts once a trigger fires: `<!--xd-h-->…<!--/xd-h-->`.
   */
  hydrate: 'xd-h',
  /**
   * A `@client`, holding its `@placeholder`, if any, which the browser replaces with the content of the block:
   * `<!--xd-c-->…<!--/xd-c-->`.
   */
  client: 'xd-c'
} as const;