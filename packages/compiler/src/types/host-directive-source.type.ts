import type { SourceFile } from 'typescript';
import type { WebComponentDecorator } from './typescript-decorator-nodes/web-component-decorator.type';

/**
 * A `@WebComponent` decorator declaring host directives for a component: the one of the component or of one of its
 * ancestors, whose host directives the component inherits.
 */
export type HostDirectiveSource = {
  /**
   * The file declaring the decorated class, which the directives are resolved from.
   */
  sourceFile: SourceFile,
  /**
   * The decorator.
   */
  decorator: WebComponentDecorator,
  /**
   * Whether the decorator is the one of the component itself, not of an ancestor.
   */
  own: boolean
};
