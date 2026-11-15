import { CustomDirective, Directive, onLeave, Property } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import type { ElementAnimation } from '../../types/element-animation.type';
import { enterElement, leaveElement } from '../../utils/element-animation/element-animation.utils';

/**
 * Animates an element as it enters the DOM, as it leaves it, or both: `enter` and `leave` are each the name of a CSS
 * class, or a function animating the element, and a side left empty is not animated.
 *
 * Entering, once the element is rendered, it gets the class of `enter`, removed at the end of the CSS animations or
 * transitions the class runs on the element itself, or it is given to the function. A class added to an element just
 * inserted runs its `@keyframes` animations; a transition needs a style to start from, which `@starting-style` gives.
 * On a page rendered on the server, the server writes the class into the HTML, so the browser runs the animation as it
 * loads the page; the hydration does not start it again, it only removes the class once the animation ends.
 *
 * Leaving, when the `@if`, the `@switch`, the `@for` or the structural directive rendering the element removes it, the
 * element stays until the CSS animations or transitions of the class of `leave` end on the element itself, or until the
 * promise of the function settles (see `onLeave`). Meanwhile it is `inert`: it takes no focus nor click, and the screen
 * readers skip it. It leaves at once when it runs no animation nor transition, and never waits longer than its CSS
 * times, with a margin, nor than the limit of the runtime (5 seconds). Only the element at the top of the block removed
 * waits: an element inside it leaves with it. The exit is registered when `leave` holds an animation as the directive
 * starts.
 *
 * With `prefers-reduced-motion: reduce` nothing is animated, unless `ignoreReducedMotion` is bound to `true`.
 *
 * @example
 * ```html
 * @import { AnimationDirective } from '@xaendar/directives'
 *
 * <li @@animation(enter="fade-in" leave="fade-out")>{ item.name }</li>
 * <section @@animation(enter="{slideIn}" leave="{slideOut}")>…</section>
 * ```
 */
@Directive({ 
  selector: 'animation' 
})
export class AnimationDirective extends CustomDirective<HTMLElement> {
  /**
   * The class the element gets while it enters, or the function animating it: none by default.
   */
  @Property<InputSignal<ElementAnimation>>('')
  public accessor enter!: InputSignal<ElementAnimation>;
  /**
   * The class the element gets while it leaves, or the function animating it: none by default.
   */
  @Property<InputSignal<ElementAnimation>>('')
  public accessor leave!: InputSignal<ElementAnimation>;
  /**
   * Whether the element is animated even when the user asked the system to reduce the motion.
   */
  @Property(false)
  public accessor ignoreReducedMotion!: InputSignal<boolean>;

  /**
   * Starts the entry of the element, and registers its exit, reading the animation of the exit when it starts.
   */
  public onInit(): void {
    enterElement(this.element, this.enter(), this.ignoreReducedMotion());
    // An element without exit leaves as any other, marking no scope
    if (this.leave()) {
      onLeave(this.element, () => leaveElement(this.element, this.leave(), this.ignoreReducedMotion()));
    }
  }
}
