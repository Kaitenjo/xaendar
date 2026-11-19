import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import type { TemplateNode } from '../../../parser/types/nodes/template-node.type';
import type { Level } from './level.type';

/**
 * A `@render`, with the part of the template it is written in.
 */
export type RenderSite = {
  /**
   * The template it renders.
   */
  readonly template: TemplateNode;
  /**
   * The `@render`.
   */
  readonly node: RenderNode;
  /**
   * The part of the template it is written in.
   */
  readonly level: Level;
};
