import { describe, expect, it } from 'vitest';
import { _defineServerRender, _getServerRender } from './server-render-registry.util';

describe('server render registry', () => {
  it('returns what the server renders exactly a class with', () => {
    class Card { }
    class SpecialCard extends Card { }
    const render = () => undefined;

    _defineServerRender(Card, render, ':host{}');

    expect(_getServerRender(Card)).toEqual({ render, css: ':host{}' });
    expect(_getServerRender(SpecialCard)).toBeUndefined();
  });

  it('joins the CSS of several stylesheets in their order, leaving out the empty ones, and keeps none without rules', () => {
    class Layered { }
    class Bare { }
    const render = () => undefined;

    _defineServerRender(Layered, render, ['a{}', undefined, 'b{}']);
    _defineServerRender(Bare, render, [undefined]);

    expect(_getServerRender(Layered)).toEqual({ render, css: 'a{}\nb{}' });
    expect(_getServerRender(Bare)).toEqual({ render });
  });
});
