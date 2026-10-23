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
  narrowedSignal?: (name: string) => string | undefined
}