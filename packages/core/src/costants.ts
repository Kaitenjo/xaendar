/**
 * Internal mapping from attribute aliases to property keys.
 */
export const INTERNAL_ALIAS_TO_ATTRIBUTE = 'aliasToAttribute';
/**
 * Internal metadata key holding the selector a web component is registered with (see `WebComponent`).
 */
export const INTERNAL_SELECTOR = 'selector';
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
 * Key of the internal method the template runtime invokes to start a directive,
 * once its inputs have been bound (see `CustomDirective`).
 */
export const DIRECTIVE_CONNECT = Symbol('DirectiveConnect');
/**
 * Key of the internal method the template runtime invokes to disconnect a directive,
 * typically when its host element is removed from the DOM.
 */
export const DIRECTIVE_DISCONNECT = Symbol('DirectiveDisconnect');