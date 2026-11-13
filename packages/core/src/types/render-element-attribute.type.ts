import type { _Context } from './context.type';
import type { BindingHost } from './binding-host.type';
import type { BindingSite } from './binding-site.type';
import type { TemplateExpression } from './template-expression.type';

/**
 * Describes a single HTML attribute to be applied to a rendered DOM element, or an input of a component or of a
 * directive. Its `class` and its `style` are described by `_RenderStyling`.
 *
 * The `setter` decides how `value` is written: `_setProperty` writes a static string once, the other setters call a
 * function of the module of the template, once or in a binding.
 *
 * N.B. Deliberate, to save memory: a constant of the module of the template, shared by every element it describes and
 * passed whole to the setter and to the binding, which keep it instead of its name and value. Do not copy its members
 * per element. A binding, a reactive attribute or input, is the binding itself (see `BindingSite`): the compiler writes
 * its callback, the setter of the same kind evaluating the expression once (`_setExpressionProperty`,
 * `_setExpressionInput`), and the slots it reserved.
 */
export type RenderElementAttribute = BindingSite & {
  /**
   * The attribute name (e.g. `id`, `href`), or the name of the property of the input.
   */
  readonly name: string;
  /**
   * The string of a static attribute, or the expression computing the value (see `TemplateExpression`).
   */
  readonly value: string | TemplateExpression<unknown>;
  /**
   * Writes the value on the target: `_setProperty`, `_setExpressionProperty` or `_setReactiveProperty` for an attribute
   * or a property, `_setInput`, `_setExpressionInput` or `_setReactiveInput` for an input.
   *
   * It is a method signature, so that each setter fits it while taking only the kind of target it is paired with, as
   * methods compare their parameters bivariantly.
   *
   * @param context - The context the binding lives in.
   * @param target - The element, or the directive whose input is bound.
   * @param attribute - This descriptor.
   */
  setter(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void;
  /**
   * Removes the attribute, or resets the property, when the branch binding it is no longer the selected one, or its
   * context is destroyed: `_removeAttribute` or `_resetProperty`.
   *
   * @param context - The context the binding lived in.
   * @param target - The element, or the directive whose input was bound.
   * @param attribute - This descriptor.
   */
  unbind?(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void;
};
