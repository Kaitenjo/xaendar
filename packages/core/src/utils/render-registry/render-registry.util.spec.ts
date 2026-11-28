import { describe, expect, it } from 'vitest';
import { _defineRender, _getRender } from './render-registry.util';

describe('render registry', () => {
  it('returns the render function registered for a class', () => {
    class Component { }
    const render = () => ({}) as never;

    _defineRender(Component, render);

    expect(_getRender(Component)).toEqual({ render });
  });

  it('returns the stylesheets registered along with the render function, in their order, without the ones of empty files', () => {
    class Component { }
    class Empty { }
    const render = () => ({}) as never;
    const base = {} as CSSStyleSheet;
    const own = {} as CSSStyleSheet;

    _defineRender(Component, render, [base, undefined, own]);
    _defineRender(Empty, render, [undefined]);

    expect(_getRender(Component)).toEqual({ render, styleSheets: [base, own] });
    expect(_getRender(Empty)).toEqual({ render });
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
