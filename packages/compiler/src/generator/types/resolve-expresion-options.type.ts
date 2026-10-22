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
  preserveNonNull?: boolean
}