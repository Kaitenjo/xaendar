import type { LayoutBlock } from './layout-block.type';
import type { LayoutItem } from './layout-item.type';

/**
 * A conditional binding of an opening tag or of a directive: a block whose bodies are items.
 */
export type LayoutConditionalBinding = LayoutBlock<LayoutItem[]>;
