/**
 * What a declared identifier holds, which tells the generated code how a binding reading it is kept up to date:
 * - `value`: a value that does not change, as an element ref, a template, `$event`, or the error of a `@catch`;
 * - `variable`: a variable of the template (the item and the implicit variables of a `@for`, a `@let`, the parameters
 *   of a template), a value the scope declaring it changes: a binding reading it is listed among the bindings its scope
 *   runs again (see `reads` of `resolveExpression`);
 * - `signal`: a name holding a signal, as a signal a template imports from a module, which an expression reads by
 *   calling it.
 */
export type IdentifierKind = 'value' | 'variable' | 'signal';
