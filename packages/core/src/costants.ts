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
 * Key of the brand marking the options `Property.required` passes to the decorator it creates, which tells them apart
 * from a default value (see `Property`).
 */
export const PROPERTY_DECORATOR_OPTIONS_WITH_REQUIRED_BRAND = Symbol('PropertyDecoratorOptionsWithRequiredBrand');