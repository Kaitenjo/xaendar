// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { playClass, prefersReducedMotion, readAnimationTimes } from './css-animation.utils';

/**
 * Makes the computed style of every element hold the given animation and transition properties.
 */
function styleWith(properties: Partial<Record<'animationName' | 'animationDuration' | 'animationDelay' | 'animationIterationCount' | 'transitionDuration' | 'transitionDelay', string>>): void {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue(properties as CSSStyleDeclaration);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('reads the media query of the reduced motion, false where there is no matchMedia', () => {
    const matchMedia = vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
    vi.stubGlobal('matchMedia', matchMedia);
    expect(prefersReducedMotion()).toBe(true);
    matchMedia.mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);

    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('readAnimationTimes', () => {
  it('reads the longest run and the last end of the animations and the transitions, the shorter lists repeated', () => {
    styleWith({
      animationName: 'a, b',
      animationDuration: '0.2s, 100ms',
      animationDelay: '50ms',
      animationIterationCount: '2, infinite',
      transitionDuration: '0.3s, 0s',
      transitionDelay: '0s, 1s'
    });

    expect(readAnimationTimes(document.createElement('div'))).toEqual({ duration: 400, end: 450 });
  });

  it('passes over the animations without name, the empty lists and the times that are not times', () => {
    styleWith({ animationName: 'none', animationDuration: '1s', transitionDuration: 'auto', transitionDelay: '' });
    expect(readAnimationTimes(document.createElement('div'))).toEqual({ duration: 0, end: 0 });

    styleWith({ animationDuration: '1s' });
    expect(readAnimationTimes(document.createElement('div'))).toEqual({ duration: 0, end: 0 });

    styleWith({ animationName: 'a', animationDuration: '', animationIterationCount: '1', transitionDuration: '0.1s', transitionDelay: '-1s' });
    expect(readAnimationTimes(document.createElement('div'))).toEqual({ duration: 100, end: 100 });
  });
});

describe('playClass', () => {
  it('applies the class and settles nothing when the element runs no animation', () => {
    styleWith({ transitionDuration: '0s' });
    const element = document.createElement('div');

    expect(playClass(element, 'fade')).toBeUndefined();
    expect(element.classList.contains('fade')).toBe(true);
  });

  it('applies the class and settles once the animation it runs on the element ends', async () => {
    styleWith({ animationName: 'fade', animationDuration: '0.2s', animationIterationCount: '1' });
    const element = document.createElement('div');
    const settled = vi.fn();

    playClass(element, 'fade')!.then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    const event = new Event('animationend');
    Object.defineProperty(event, 'elapsedTime', { value: 0.2 });
    element.dispatchEvent(event);
    await Promise.resolve();

    expect(settled).toHaveBeenCalledOnce();
  });
});
