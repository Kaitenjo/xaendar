import type { ElementAnimation } from '../../types/element-animation.type';
import { playClass, prefersReducedMotion } from '../css-animation/css-animation.utils';

/**
 * Animates an element entering the DOM (see `enter` of `AnimationDirective`): applies the class, removed once the CSS
 * animations or transitions it runs on the element end, or gives the element to the function. Nothing runs without an
 * animation, nor when the user asked the system to reduce the motion, unless told to ignore it.
 *
 * On the server, which has no computed style, the class is only written into the HTML, so that the browser runs its
 * animation as it loads the page: the hydration finds it on the element, which does not start the animation again, and
 * only waits for its end to remove it, at once when the motion is to be reduced. The server cannot run a function: the
 * hydration runs it.
 *
 * @param element - The element.
 * @param animation - The class, or the function animating the element.
 * @param ignoreReducedMotion - Whether the element is animated even when the motion is to be reduced.
 */
export function enterElement(element: HTMLElement, animation: ElementAnimation, ignoreReducedMotion: boolean): void {
  if (!animation) {
    return;
  }

  if (typeof getComputedStyle !== 'function') {
    if (typeof animation === 'string') {
      element.classList.add(animation);
    }

    return;
  }

  const reduced = !ignoreReducedMotion && prefersReducedMotion();
  if (typeof animation === 'function') {
    if (!reduced) {
      animation(element);
    }

    return;
  }

  // The class the server wrote, if any, goes: the animation it runs since the page loaded is cut short
  if (reduced) {
    element.classList.remove(animation);
    return;
  }

  // Applying again the class the server wrote restarts nothing: the animation running since the page loaded is waited for
  const running = playClass(element, animation);
  running ? running.then(() => element.classList.remove(animation)) : element.classList.remove(animation);
}

/**
 * Animates an element leaving the DOM (see `leave` of `AnimationDirective`): makes it inert, so that it takes no focus nor click and
 * the screen readers skip it, then applies the class, waiting for the CSS animations or transitions it runs on the
 * element, or gives the element to the function, waiting for its promise. It leaves at once without an animation, and
 * when the user asked the system to reduce the motion, unless told to ignore it.
 *
 * @param element - The element.
 * @param animation - The class, or the function animating the element.
 * @param ignoreReducedMotion - Whether the element is animated even when the motion is to be reduced.
 * @returns A promise settling once the element can be removed, nothing to remove it at once.
 */
export function leaveElement(element: HTMLElement, animation: ElementAnimation, ignoreReducedMotion: boolean): Promise<void> | undefined {
  element.setAttribute('inert', '');
  if (!ignoreReducedMotion && prefersReducedMotion()) {
    return undefined;
  }

  if (typeof animation === 'function') {
    const running = animation(element);
    return running ? running.then(() => undefined) : undefined;
  }

  return animation ? playClass(element, animation) : undefined;
}
