// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enterElement, leaveElement } from './element-animation.utils';

/**
 * Makes the computed style of every element hold an animation, or a transition, of the given duration, none without
 * one.
 */
function runFor(duration?: string, kind: 'animation' | 'transition' = 'animation'): void {
  const style = !duration ? {} : kind === 'animation' ? { animationName: 'run', animationDuration: duration } : { transitionDuration: duration };
  vi.spyOn(window, 'getComputedStyle').mockReturnValue(style as unknown as CSSStyleDeclaration);
}

/**
 * Makes the system ask, or not, to reduce the motion.
 */
function reduceMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
}

/**
 * Dispatches on a target the end of an animation or a transition, which bubbles, as the browsers do.
 */
function end(target: Element, type: string, elapsedTime: number): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'elapsedTime', { value: elapsedTime });
  target.dispatchEvent(event);
}

/**
 * Lets the promises settled run their callbacks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('enterElement', () => {
  it('applies the class, and removes it at the end of the animation it runs on the element', async () => {
    reduceMotion(false);
    runFor('0.2s');
    const element = document.createElement('div');

    enterElement(element, 'fade-in', false);
    expect(element.classList.contains('fade-in')).toBe(true);
    end(element, 'animationend', 0.2);
    await flush();

    expect(element.classList.contains('fade-in')).toBe(false);
  });

  it('removes the class at once when the element runs no animation', () => {
    reduceMotion(false);
    runFor();
    const element = document.createElement('div');

    enterElement(element, 'fade-in', false);

    expect(element.className).toBe('');
  });

  it('gives the element to the function', () => {
    reduceMotion(false);
    const animation = vi.fn();
    const element = document.createElement('div');

    enterElement(element, animation, false);

    expect(animation).toHaveBeenCalledExactlyOnceWith(element);
  });

  it('runs nothing without an animation, nor with the motion reduced unless told to ignore it', () => {
    runFor('0.2s');
    const animation = vi.fn();
    const [empty, reduced, ignored] = [document.createElement('div'), document.createElement('div'), document.createElement('div')];

    reduceMotion(false);
    enterElement(empty, '', false);
    reduceMotion(true);
    enterElement(reduced, animation, false);
    enterElement(reduced, 'fade-in', false);
    enterElement(ignored, animation, true);

    expect(empty.className).toBe('');
    expect(reduced.className).toBe('');
    expect(animation).toHaveBeenCalledExactlyOnceWith(ignored);
  });

  it('only writes the class on the server, which has no computed style, and runs no function there', () => {
    vi.stubGlobal('getComputedStyle', undefined);
    const animation = vi.fn();
    const element = document.createElement('div');

    enterElement(element, animation, false);
    enterElement(element, 'fade-in', false);

    expect(animation).not.toHaveBeenCalled();
    expect(element.className).toBe('fade-in');
  });

  it('waits in the hydration for the end of the animation the class of the server runs, without starting it again, then removes it', async () => {
    reduceMotion(false);
    runFor('0.2s');
    const element = document.createElement('div');
    element.className = 'fade-in';
    const add = vi.spyOn(element.classList, 'add');

    enterElement(element, 'fade-in', false);
    await flush();
    expect(element.className).toBe('fade-in');
    end(element, 'animationend', 0.2);
    await flush();

    expect(add).toHaveBeenCalledExactlyOnceWith('fade-in');
    expect(element.className).toBe('');
  });

  it('removes at once in the hydration the class of the server when the motion is to be reduced', () => {
    reduceMotion(true);
    runFor('0.2s');
    const element = document.createElement('div');
    element.className = 'fade-in other';

    enterElement(element, 'fade-in', false);

    expect(element.className).toBe('other');
  });
});

describe('leaveElement', () => {
  it('makes the element inert and applies the class, settling at the end of the transition of the element itself', async () => {
    reduceMotion(false);
    runFor('0.3s', 'transition');
    const element = document.createElement('div');
    const child = element.appendChild(document.createElement('span'));
    const settled = vi.fn();

    leaveElement(element, 'fade-out', false)!.then(settled);
    expect(element.hasAttribute('inert')).toBe(true);
    expect(element.classList.contains('fade-out')).toBe(true);
    end(child, 'transitionend', 0.3);
    await flush();
    expect(settled).not.toHaveBeenCalled();

    end(element, 'transitionend', 0.3);
    await flush();
    expect(settled).toHaveBeenCalledOnce();
  });

  it('settles at once when the element runs no animation nor transition, or without an animation', () => {
    reduceMotion(false);
    runFor();
    const element = document.createElement('div');
    const empty = document.createElement('div');

    expect(leaveElement(element, 'fade-out', false)).toBeUndefined();
    expect(element.hasAttribute('inert')).toBe(true);
    expect(leaveElement(empty, '', false)).toBeUndefined();
    expect(empty.hasAttribute('inert')).toBe(true);
  });

  it('settles once the promise of the function settles, at once when it returns none', async () => {
    reduceMotion(false);
    let finish!: (value: string) => void;
    const animation = vi.fn((_element: HTMLElement) => new Promise<string>(resolve => finish = resolve));
    const element = document.createElement('div');
    const settled = vi.fn();

    leaveElement(element, animation, false)!.then(settled);
    expect(animation).toHaveBeenCalledExactlyOnceWith(element);
    finish('done');
    await flush();

    expect(settled).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(leaveElement(element, vi.fn<() => void>(), false)).toBeUndefined();
  });

  it('settles at once, inert, with the motion reduced, unless told to ignore it', () => {
    reduceMotion(true);
    runFor('0.3s', 'transition');
    const reduced = document.createElement('div');
    const ignored = document.createElement('div');

    expect(leaveElement(reduced, 'fade-out', false)).toBeUndefined();
    expect(reduced.hasAttribute('inert')).toBe(true);
    expect(reduced.className).toBe('');
    expect(leaveElement(ignored, 'fade-out', true)).toBeInstanceOf(Promise);
  });
});
