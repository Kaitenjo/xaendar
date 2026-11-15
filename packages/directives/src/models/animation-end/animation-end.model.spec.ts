// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnimationEnd, END_MARGIN } from './animation-end.model';

/**
 * Dispatches on a target an event of the end of an animation or a transition, which bubbles, as the browsers do.
 */
function dispatch(target: Element, type: string, elapsedTime = 0): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'elapsedTime', { value: elapsedTime });
  target.dispatchEvent(event);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('AnimationEnd', () => {
  it('settles at the end of the longest animation of the element itself, then stops listening', () => {
    const element = document.createElement('div');
    const child = element.appendChild(document.createElement('span'));
    const resolve = vi.fn();
    new AnimationEnd(element, 300, 300, resolve);

    dispatch(child, 'animationend', 0.3);
    dispatch(element, 'transitionend', 0.1);
    expect(resolve).not.toHaveBeenCalled();

    dispatch(element, 'animationend', 0.3);
    dispatch(element, 'transitionend', 0.3);
    expect(resolve).toHaveBeenCalledOnce();
  });

  it('settles when an animation or a transition of the element is cancelled', () => {
    const element = document.createElement('div');
    const animation = vi.fn();
    const transition = vi.fn();
    new AnimationEnd(element, 300, 300, animation);
    dispatch(element, 'animationcancel');
    new AnimationEnd(element, 300, 300, transition);
    dispatch(element, 'transitioncancel');

    expect(animation).toHaveBeenCalledOnce();
    expect(transition).toHaveBeenCalledOnce();
  });

  it('settles once the time of the animations has passed with the margin, without their events', () => {
    vi.useFakeTimers();
    const element = document.createElement('div');
    const resolve = vi.fn();
    new AnimationEnd(element, 200, 500, resolve);

    vi.advanceTimersByTime(500 + END_MARGIN - 1);
    expect(resolve).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(resolve).toHaveBeenCalledOnce();
    dispatch(element, 'animationend', 0.2);
    expect(resolve).toHaveBeenCalledOnce();
  });
});
