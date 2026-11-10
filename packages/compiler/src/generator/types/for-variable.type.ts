import type { ForImplicitVariables } from '../../parser/types/nodes/for-implicit-variables.type';

/**
 * A variable a `@for` declares in its body: its item, or one of its implicit variables, named as the template writes
 * them without aliases. The names the `used` of the `IterationVariables` of the runtime lists, the variables to create.
 */
export type ForVariable = 'item' | ForImplicitVariables;
