/**
 * What declares a variable before it is initialized (see `_Context.declare`): an element ref, initialized once the
 * element it names is rendered, or a `@let`, initialized once the render reaches it.
 */
export type _DeclarationKind = 'element' | 'let';
