/**
 * Internal mapping from attribute aliases to property keys.
 */
export const INTERNAL_ALIAS_TO_ATTRIBUTE = 'aliasToAttribute';
/**
 * Internal metadata key holding the names of the properties of the inputs `@Property.required` declares.
 */
export const INTERNAL_REQUIRED_INPUTS = 'requiredInputs';
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
 * Internal metadata key holding the events a web component or a custom directive listens to, on its host element, the
 * window or the document (see `HostListener`).
 */
export const INTERNAL_HOST_LISTENERS = 'hostListeners';
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
 * Key of the order of a directive among the ones of its element, which decides which one wins when two of them write the
 * same key of `class` or `style` (see `StylingSource.order`): the host directives first, in the order the component
 * declares them, then the ones of the template, in the order they appear on the element.
 */
export const DIRECTIVE_ORDER = Symbol('DirectiveOrder');
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
 * The slot of a scope (see `_Context`) holding the scope declaring its block, whose variables it reads.
 *
 * N.B. Deliberate, to save memory: a scope is a plain array of the exact length its layout gives, its slots decided by
 * the compiler, as Angular does with its `LView`, instead of an object with a field per member and two arrays of its
 * own, the variables by name and the nodes, which every scope paid, the rows of a table included. The header holds the
 * slots every scope has, at fixed indices, then come the variables, each at a slot the compiler assigns, then the nodes
 * at the top of the block, then the containers of its blocks (see `_ScopeLayout`). The variables come before the nodes
 * because the compiler knows them all before it generates the body of the block, while it counts the nodes and the
 * blocks as it generates them: the reads of the body need the slots of the variables first. Do not go back to an
 * object, nor to lists searched by name at runtime.
 */
export const PARENT = 0;
/**
 * The slot of a scope holding the node the nodes at the top of its block are inserted into.
 */
export const PARENT_NODE = 1;
/**
 * The slot of a scope holding the component whose template it renders, `this` of its expressions.
 *
 * N.B. Deliberate, to save memory and time: the header holds only what every scope needs at every render (`PARENT`,
 * `PARENT_NODE`, `COMPONENT`, `CLEANUP`, `LAYOUT`), read by every expression and every helper without a lookup. The
 * strategy getting the nodes of a scope differs from creating them only while a hydration runs, so the scopes adopting
 * nodes keep it in a map of the module (see `getNodeStrategy`), and the pass of the refresh running only while it runs,
 * so the scopes it brought up to date are in a set of the module (see `refresh`): two slots fewer for every scope, a
 * row of a table included. Do not add them back to the header, nor move a slot read at every render out of it.
 */
export const COMPONENT = 2;
/**
 * The slot of a scope holding what it runs or disposes when it is cleared that the compiler does not know: the
 * listeners, the directives, the components created by code, the scopes held outside of the containers, and the
 * bindings the runtime renders in a scope of its own (see `Binding`). The bindings of a compiled template are not here:
 * their scope keeps them in slots of its own (see `BindingSite`).
 *
 * N.B. Deliberate, to save memory: the cleanup functions and the bindings of the runtime share one slot, the item itself
 * while there is one, an array from the second, `null` while there is none, instead of two lists, which cost an array per
 * scope as soon as it has both a listener and a binding. Do not split them again, nor make an array of a single item.
 */
export const CLEANUP = 3;
/**
 * The slot of a scope holding its layout (see `_ScopeLayout`), shared by every instance of its block: where its nodes,
 * its bindings and its containers start, and the names of its variables for the errors.
 *
 * N.B. Deliberate: the one slot telling where the nodes start, since the variables before them vary from a block to
 * another, and the runtime clears and moves the nodes of scopes whose block it does not know. Do not encode it in
 * another slot: a slot holding a small integer (a smi) or a reference costs nothing more, an encoded value would cost
 * a decoding at every read.
 */
export const LAYOUT = 4;
/**
 * The number of slots of the header of a scope: the slot of its first variable. The compiler writes the same number
 * (`SCOPE_HEADER` of `@xaendar/compiler`): change both together.
 */
export const HEADER = 5;
/**
 * The number of slots of a container (see `_ScopeLayout`): the one holding what the block shows ({@link CONTENT}), the
 * one holding its state ({@link BRANCH}, {@link KEYS}), and the one telling where it renders ({@link POSITION}). The
 * compiler writes the same number (`CONTAINER_SLOTS` of `@xaendar/compiler`): change both together.
 *
 * N.B. Deliberate, to save memory: the state of a block lives in a few slots of the scope holding it, the same number
 * for every block, so that the runtime finds the containers without a list, instead of an object per block (where it
 * renders, the scope holding it, its configuration, its branch, whether it ran) and one more for its anchor, which a
 * large table paid for every `@if` and `@switch` of every cell. The blocks rendered rarely (`@defer`, `@try`,
 * `@hydrate`, `@client`, the element structural directives are applied to) leave the other two slots empty. Do not
 * give a block an object of its own again.
 */
export const CONTAINER_SLOTS = 3;
/**
 * The slot of a container, from its first one, holding what the block shows: the scope of its content, `null`, the
 * rows of a `@for`, the branch of an `@if` or of a `@switch` rendered inline (see `InlineBranch`).
 */
export const CONTENT = 0;
/**
 * The slot of the container of an `@if` or of a `@switch` holding the index of the branch rendered: `null` when it
 * renders none, `-1` before its first run, which adopts the nodes of the server.
 */
export const BRANCH = 1;
/**
 * The slot of the container of a `@for` holding the keys of its rows, in their order, an array of their exact number:
 * the slot of {@link BRANCH}, which tells the two apart.
 */
export const KEYS = 1;
/**
 * The slot of a container telling where the block renders: its anchor, which the content is inserted before, or, for
 * the last block of its parent, which has none, the parent itself, which the content is appended to.
 */
export const POSITION = 2;
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
 * The key of the property of `window` holding the event contract, the script `renderToString` writes into the page (see
 * `_EventContract`). It is a symbol of the global registry, which no other property can clash with: the script, whose
 * text reads nothing outside of it, gets the same symbol from `Symbol.for` and its description.
 */
export const _EVENT_CONTRACT_KEY: unique symbol = Symbol.for('xaendar.eventContract');
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
  client: 'xd-c',
  /**
   * A `@try`, its detail `0` when the server rendered its content, `1` when it rendered its `@catch`:
   * `<!--xd-t:0-->…<!--/xd-t-->`.
   */
  try: 'xd-t',
  /**
   * A `@defer`, holding its `@placeholder`, if any, which the browser adopts and replaces with the content of the block
   * once a trigger fires: `<!--xd-d-->…<!--/xd-d-->`.
   */
  defer: 'xd-d'
} as const;