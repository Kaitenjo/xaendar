/**
 * Whether a generator context stands for a scope of the runtime, an array created by the generated code or by the
 * runtime, which the expressions inside it read the variables of the enclosing scopes through (see
 * `CompilerContext.readIdentifier`):
 * - `scope`: always, as the content of a block, created by the generated code from a layout of the compiler;
 * - `runtime`: always, as the element structural directives are applied to and the branch of a conditional binding,
 *   which the runtime creates with a layout of its own: the compiler reserves no slot in it (see
 *   `GeneratorContext.declareBinding`);
 * - `declarations`: only when it declares variables, as the children of an element a structural directive is applied
 *   to, which otherwise are rendered in the scope of the element; the children of an element opening a namespace and
 *   the track expression of a `@for` declare none;
 * - `inline`: never, as a branch of an `@if` or of a `@switch` declaring no variable and rendering no block, rendered into
 *   the scope holding the block, in slots of its own (see `GeneratorContext.declareLayout`): its expressions read the
 *   variables as the ones of that scope do.
 */
export type ScopeKind = 'scope' | 'runtime' | 'declarations' | 'inline';
