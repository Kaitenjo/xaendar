import { AnimationEnd } from '../../models/animation-end/animation-end.model';
import type { AnimationTimes } from '../../types/animation-times.type';

/**
 * The times of an element running no animation, or no transition.
 */
const NO_TIMES: AnimationTimes = Object.freeze({ duration: 0, end: 0 });

/**
 * Tells whether the user asked the system to reduce the motion of the interfaces (`prefers-reduced-motion: reduce`).
 *
 * @returns `true` when the motion is to be reduced.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Applies a CSS class to an element and waits for the animations and the transitions it runs then: the ones of the
 * element itself, not of its descendants.
 *
 * @param element - The element.
 * @param className - The class.
 * @returns A promise settling once they end, or their time has passed (see `AnimationEnd`); nothing when the element
 *   runs none.
 */
export function playClass(element: Element, className: string): Promise<void> | undefined {
  element.classList.add(className);
  const { duration, end } = readAnimationTimes(element);
  if (end === 0) {
    return undefined;
  }

  return new Promise<void>(resolve => new AnimationEnd(element, duration, end, resolve));
}

/**
 * Reads from the computed style of an element how long its CSS animations and transitions run.
 *
 * @param element - The element.
 * @returns The longest run, and the time the last one ends at, both `0` when it runs none.
 */
export function readAnimationTimes(element: Element): AnimationTimes {
  const style = getComputedStyle(element);
  const animations = style.animationName === 'none' || !style.animationName
    ? NO_TIMES
    : readTimes(style.animationDuration, style.animationDelay, style.animationIterationCount);
  const transitions = readTimes(style.transitionDuration, style.transitionDelay, '1');
  return { duration: Math.max(animations.duration, transitions.duration), end: Math.max(animations.end, transitions.end) };
}

/**
 * Reads the times of the animations, or of the transitions, of a computed style: the lists of their durations, delays
 * and iteration counts, each item of the shorter lists repeated as CSS does.
 *
 * @param durations - The durations (`0.3s, 150ms`).
 * @param delays - The delays.
 * @param iterations - The iteration counts, `1` for the transitions, which run once. `infinite` counts as one.
 * @returns The longest run, and the time the last one ends at.
 */
function readTimes(durations: string, delays: string, iterations: string): AnimationTimes {
  const durationList = (durations || '0s').split(',');
  const delayList = (delays || '0s').split(',');
  const iterationList = (iterations || '1').split(',');
  let duration = 0;
  let end = 0;
  for (let i = 0; i < durationList.length; i++) {
    const count = Number.parseFloat(iterationList[i % iterationList.length]);
    const run = toMilliseconds(durationList[i]) * (Number.isFinite(count) ? count : 1);
    if (run > 0) {
      duration = Math.max(duration, run);
      end = Math.max(end, run + Math.max(0, toMilliseconds(delayList[i % delayList.length])));
    }
  }

  return { duration, end };
}

/**
 * Converts a CSS time into milliseconds.
 *
 * @param time - The time, in seconds (`0.3s`) or in milliseconds (`300ms`).
 * @returns The milliseconds, `0` for a time that is not one.
 */
function toMilliseconds(time: string): number {
  const value = Number.parseFloat(time);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return time.trim().endsWith('ms') ? value : value * 1000;
}
