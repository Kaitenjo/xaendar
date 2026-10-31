/**
 * Whether a declared identifier holds a plain value or a signal.
 * Used by `resolveExpression`/`resolveIdentifier` to decide, at compile
 * time, whether generated access code needs a trailing `()` to unwrap the
 * signal — no runtime type detection is ever needed.
 */
export type IdentifierKind = 'value' | 'signal';
