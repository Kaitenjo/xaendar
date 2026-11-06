import type { DeferBlockState } from './defer-block-state.type';

/**
 * A `@defer` block a component renders, as a test drives it (see `getDeferBlocks`).
 */
export type DeferBlockFixture = {
  /**
   * The part the block shows.
   */
  readonly state: DeferBlockState;
  /**
   * Shows a part of the block at once, whatever its triggers and its times, which stop: the content once the modules it
   * loads are loaded (`complete`), and the `@error` with the error given. The promise is rejected when the block does
   * not declare the part, or the modules fail to load.
   *
   * @param state - The part to show.
   * @param error - The error the `@error` receives.
   * @returns Resolves once the part is shown.
   */
  render(state: DeferBlockState, error?: unknown): Promise<void>;
};
