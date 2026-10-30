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
});
