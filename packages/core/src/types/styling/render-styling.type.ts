import type { BindingHost } from '../binding-host.type';
import type { BindingSite } from '../binding-site.type';
import type { _Context } from '../context.type';
import type { TemplateExpression } from '../template-expression.type';
import type { StylingAttribute } from './styling-attribute.type';

/**
 * Everything a template writes on the `class` or on the `style` of an element, or of a branch of one of its conditional
 * bindings: its string, static (`class="a b"`) or an expression (`class="{kind()}"`), and the keys it binds one by one
 * (`[class.on]`, `[style.width.px]`), all in one binding, which applies the keys over the string and writes only the
 * keys whose value changes. A constant of the module of the template, which the compiler writes after the element.
 *
 * N.B. Deliberate, to save memory: one binding for the whole attribute instead of one per key, so that an element keeps
 * one effect and three slots (the effect, the element and the values computed last) instead of one effect per key. Do
 * not split it into a binding per key again.
 */
export type _RenderStyling = BindingSite & {
  /**
   * The attribute.
   */
  readonly name: StylingAttribute;
  /**
   * The static string as written, set at once on an element without the attribute.
   */
  readonly text?: string;
  /**
   * The opinions of the static string, parsed by the compiler: the classes, present (`['card', true]`), or the names and
   * the values of the declarations (`['display', 'flex']`).
   */
  readonly statics?: ReadonlyArray<string | boolean>;
  /**
   * The expression of the string, when it is not static.
   */
  readonly string?: TemplateExpression<unknown>;
  /**
   * The keys bound one by one: the classes, or the properties, in CSS (kebab-case, custom properties as written).
   */
  readonly keys?: readonly string[];
  /**
   * The expressions of the keys, in the order of `keys`.
   */
  readonly values?: ReadonlyArray<TemplateExpression<unknown>>;
  /**
   * The units of the properties, in the order of `keys`, empty for a property without one: left out when none has one.
   */
  readonly units?: readonly string[];
  /**
   * Applies the binding.
   *
   * @param context - The current template execution scope.
   * @param target - The element.
   * @param styling - The binding.
   */
  setter(context: _Context, target: Element | BindingHost, styling: _RenderStyling): void;
  /**
   * Removes what the binding wrote, when the branch declaring it is no longer selected.
   *
   * @param context - The current template execution scope.
   * @param target - The element.
   * @param styling - The binding.
   */
  unbind?(context: _Context, target: Element | BindingHost, styling: _RenderStyling): void;
};
