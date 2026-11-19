import { describe, expect, it } from 'vitest';
import { _defineRender, _getRender } from './render-registry.util';

describe('render registry', () => {
  it('returns the render function registered for a class', () => {
    class Component { }
    const render = () => ({}) as never;

    _defineRender(Component, render);

    expect(_getRender(Component)).toEqual({ render, styleSheet: undefined });
  });

  it('returns the stylesheet registered along with the render function', () => {
    class Component { }
    const render = () => ({}) as never;
    const styleSheet = {} as CSSStyleSheet;

    _defineRender(Component, render, styleSheet);

    expect(_getRender(Component)).toEqual({ render, styleSheet });
  });

  it('does not inherit the render function of an ancestor', () => {
    class Parent { }
    class Child extends Parent { }

    _defineRender(Parent, () => ({}) as never);

    expect(_getRender(Child)).toBeUndefined();
  });

  it('returns undefined when no render function is registered', () => {
    class Component { }

    expect(_getRender(Component)).toBeUndefined();
  });
});
