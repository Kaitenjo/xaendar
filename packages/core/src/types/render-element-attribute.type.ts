import type { BindingHost } from './binding-host.type';
import type { BindingSite } from './binding-site.type';
import type { _Context } from './context.type';
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
   * The attribute name (e.g. `id`, `href`), the name of the property of the input, or the name an input of a host
   * directive is exposed with on its component.
   */
  readonly name: string;
  /**
   * The string of a static attribute, or the expression computing the value (see `TemplateExpression`).
   */
  readonly value: string | TemplateExpression<unknown>;
  /**
   * Set on an attribute of an element whose component or directives may write it too (see `RenderElement.shared`): its
   * value is the opinion of the template in the state merging them, when the element has one (see `AttributeState`).
   * Left out for the others, which write the attribute directly without looking a state up.
   */
  readonly shared?: true;
  /**
   * Writes the value on the target: `_setProperty`, `_setExpressionProperty` or `_setReactiveProperty` for an attribute
   * or a property, `_setAttribute`, `_setExpressionAttribute` or `_setReactiveAttribute` for an attribute written with
   * `attr.`, never an input whatever its name, `_setInput`, `_setExpressionInput` or `_setReactiveInput` for an input,
   * `_setExposedInput`, `_setExpressionExposedInput` or `_setReactiveExposedInput` for an input a host directive of the
   * component exposes, written into the directive.
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
   * Removes the attribute, giving it back to the sources below when it is merged with them, or resets the property,
   * when the branch binding it is no longer the selected one, or its context is destroyed: `_removeAttribute`,
   * `_resetProperty` or `_resetExposedInput`.
   *
   * @param context - The context the binding lived in.
   * @param target - The element, or the directive whose input was bound.
   * @param attribute - This descriptor.
   */
  unbind?(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void;
};
