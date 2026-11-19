import type { GeneratorContext } from '../context/context';

/**
 * The element whose descriptors are being written (see `generateElement`): the functions of the module computing their
 * expressions are named after it, and resolved in its scope.
 */
export type DescriptorOwner = {
  /**
   * The name of the element in the generated code, which the names of the functions start with.
   */
  readonly name: string;
  /**
   * The generator context of the scope of the element.
   */
  readonly generatorContext: GeneratorContext;
};
