import type { ForImplicitVariables } from '../../parser/types/nodes/for-implicit-variables.type';

/**
 * A variable a `@for` declares in its body: its item, or one of its implicit variables, named as the template writes
 * them without aliases. The names `_iterationVariables` of the runtime takes in the list of the variables to create.
 */
export type ForVariable = 'item' | ForImplicitVariables;
