/**
 * Whether a generator context stands for a scope of the runtime, an array created by the generated code or by the
 * runtime, which the expressions inside it read the variables of the enclosing scopes through (see
 * `CompilerContext.readIdentifier`):
 * - `scope`: always, as the content of a block, the element structural directives are applied to, the branch of a
 *   conditional binding;
 * - `declarations`: only when it declares variables, as the children of an element a structural directive is applied
 *   to, which otherwise are rendered in the scope of the element; the children of an element opening a namespace and
 *   the track expression of a `@for` declare none.
 */
export type ScopeKind = 'scope' | 'declarations';
