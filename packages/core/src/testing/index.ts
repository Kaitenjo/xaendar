import { setDeferBlockBehavior } from '../utils/defer-testing/defer-testing.util';

export type { DeferBlockBehavior } from '../types/defer-testing/defer-block-behavior.type';
export type { DeferBlockFixture } from '../types/defer-testing/defer-block-fixture.type';
export type { DeferBlockState } from '../types/defer-testing/defer-block-state.type';
export { getDeferBlocks, setDeferBlockBehavior } from '../utils/defer-testing/defer-testing.util';

// The blocks rendered from now on are found by the tests, and play through
setDeferBlockBehavior('playthrough');
