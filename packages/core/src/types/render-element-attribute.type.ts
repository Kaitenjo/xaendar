import type { NoArgsFunction } from '@xaendar/types';
import { _removeAttribute, _removeClass, _resetProperty } from '../utils';
import type { _Context } from '../utils/context/context.util';
import type { BindingHost } from './binding-host.type';

/**
 * Describes a single HTML attribute to be applied to a rendered DOM element, or a class toggled on it
 * (`[class.name]`), whose name is then the name of the class.
 *
 * The `setter` decides how `value` is written: `_setProperty` writes a static string once, the other setters read a
 * getter, once or in an effect.
 */
export type RenderElementAttribute = {
  /**
   * The attribute name (e.g. `class`, `id`, `href`), or the name of the toggled class.
   */
  name: string,
  /**
   * The string of a static attribute, or a getter returning the value, resolved against the current context.
   */
  value: string | NoArgsFunction<unknown>,
  /**
   * Writes the value on the target: `_setProperty`, `_setExpressionProperty` or `_setReactiveProperty` for an attribute
   * or a property, `_setExpressionClass` or `_setReactiveClass` for a class.
   *
   * It is a method signature, so that each setter fits it while taking only the kind of value it is paired with
   * (`_setProperty` a string, the others a getter), as methods compare their parameters bivariantly.
   *
   * @param context - The context the binding lives in.
   * @param target - The element, or the directive whose input is bound.
   * @param name - The name of the attribute, of the property or of the class.
   * @param value - The value of the attribute.
   */
  setter(context: _Context, target: Element | BindingHost, name: string, value: string | NoArgsFunction<unknown>): void,
  /**
   * Removes the attribute, or the class, when the context binding it is destroyed.
   */
  unbind?: typeof _removeAttribute | typeof _resetProperty | typeof _removeClass;
}
