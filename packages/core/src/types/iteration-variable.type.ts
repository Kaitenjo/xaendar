/**
 * A variable a `@for` declares in its body: its item, or one of its implicit variables, named as the template writes
 * them without aliases.
 */
export type IterationVariable = 'item' | '$index' | '$first' | '$last' | '$even' | '$odd';
