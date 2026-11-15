/**
 * How an element enters or leaves (see the `enter` and the `leave` of `AnimationDirective`): the name of a CSS class whose
 * animations or transitions the element runs, or a function animating the element, returning a promise that settles
 * once it is done, as the `finished` of a Web Animation (`element.animate(…).finished`).
 *
 * @param element - The element entering or leaving.
 * @returns A promise settling once the animation is done, nothing when there is none to wait for.
 */
export type ElementAnimation = string | ((element: HTMLElement) => Promise<unknown> | void);
