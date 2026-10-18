import { NoArgsFunction } from '@xaendar/types';
import { _removeAttribute, _removeClass, _resetProperty, _setExpressionClass, _setExpressionProperty, _setProperty, _setReactiveClass, _setReactiveProperty } from '../utils';

/**
 * Describes a single HTML attribute to be applied to a rendered DOM element, or a class toggled on it
 * (`[class.name]`), whose name is then the name of the class.
 *
 * When `literal` is `true`, `value` is a raw string written directly as the
 * attribute value. When `false`, `value` is a getter function resolved at
 * render time against the current {@link Context}.
 */
export type RenderElementAttribute = {
  /**
   * The attribute name (e.g. `class`, `id`, `href`), or the name of the toggled class.
   */
  name: string,
  /**
   * A getter returning the attribute value, or a reactive identifier resolved against the current context.
   */
  value: NoArgsFunction<unknown>,
  /**
   * When `true`, the value is a static string literal; when `false`, it is a reactive expression.
   */
  setter: typeof _setProperty & typeof _setExpressionProperty & typeof _setReactiveProperty & typeof _setExpressionClass & typeof _setReactiveClass;
  /**
   * Removes the attribute, or the class, when the context binding it is destroyed.
   */
  unbind?: typeof _removeAttribute | typeof _resetProperty | typeof _removeClass;
}
