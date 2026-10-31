import type { GeneratorTransitionFunctionReturnType } from './generator-transition-function-return-type.type';

/**
 * A function the generator writes at module level, rendering the children of a node (see
 * {@link GeneratorTransitionFunctionReturnType.functionsToProcess}).
 */
export type GeneratorFunctionToProcess = Required<GeneratorTransitionFunctionReturnType>['functionsToProcess'] extends Map<string, infer Value> ? Value : never;
