/**
 * Options for resolving an expression during code generation.
 */
export type ResolveExpressionOptions = {
  /**
   * The name of the resolver function to use for resolving the expression.
   */
  resolver?: string,
  /**
   * Whether to keep the non-null assertions (`value!`) in the resolved expression.
   * They are TypeScript only: dropped from the JavaScript code, kept in the type-check code.
   */
  preserveNonNull?: boolean,
  /**
   * Returns the constant holding the value of a signal an `@if` narrows, which a call of the signal without arguments
   * is read through, after the call: `(root.user(), __if12_user)`. Only the type-check code narrows the signals.
   */
  narrowedSignal?: (name: string) => string | undefined,
  /**
   * The object the global identifiers of the browser that ECMAScript does not define are read from, e.g. `globalThis`:
   * the code rendering on the server reads `globalThis.document`, `undefined` there, where `document` would throw a
   * `ReferenceError`. A member of the component named like one of them keeps shadowing it. They are left as written
   * when omitted.
   */
  browserGlobals?: string
}
