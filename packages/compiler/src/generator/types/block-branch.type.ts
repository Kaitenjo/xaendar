import type { GeneratorContext } from '../context/context';

/**
 * A branch of an `@if` or of a `@switch`, as the constant of the block describes it (see `GeneratorContext.declareBlock`).
 */
export type BlockBranch = {
  /**
   * The members of the description of the branch: what selects it and the function rendering it.
   */
  readonly members: readonly string[];
  /**
   * The generator context of a branch rendered inline into the runtime scope holding the block (see `ScopeKind`), whose
   * slots its description lists once every function is generated: left out for a branch rendered in a scope of its own.
   */
  readonly context?: GeneratorContext;
};
