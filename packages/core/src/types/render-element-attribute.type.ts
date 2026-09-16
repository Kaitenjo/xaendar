import { NoArgsFunction } from '@xaendar/types';
import { bindProperty, bindReactiveProperty, removeAttribute, setAttribute } from '../utils';

/**
 * Describes a single HTML attribute to be applied to a rendered DOM element.
 *
 * When `literal` is `true`, `value` is a raw string written directly as the
 * attribute value. When `false`, `value` is a getter function resolved at
 * render time against the current {@link Context}.
 */
export type RenderElementAttribute = {
  /** 
   * The attribute name (e.g. `class`, `id`, `href`). 
   */
  name: string,
  /** 
   * A getter returning the attribute value, or a reactive identifier resolved against the current context. 
   */
  value: NoArgsFunction<unknown>,
  /** 
   * When `true`, the value is a static string literal; when `false`, it is a reactive expression. 
   */
  setter: typeof bindProperty & typeof bindReactiveProperty;
} & ({
  /**
   * A function to unbind or reset the attribute, such as removing it or setting a default value.
   */
  unbind: typeof removeAttribute;
  /**
   * The default value to use when unbinding the attribute.
   */
  defaultValue?: never;
} | {
  /**
   * A function to unbind or reset the attribute, such as removing it or setting a default value.
   */
  unbind: typeof setAttribute;
  /**
   * The default value to use when unbinding the attribute.
   */
  defaultValue: unknown;
} | {
  /**
   * A function to unbind or reset the attribute, such as removing it or setting a default value.
   */
  unbind?: never;
  /**
   * The default value to use when unbinding the attribute.
   */
  defaultValue?: never;
})