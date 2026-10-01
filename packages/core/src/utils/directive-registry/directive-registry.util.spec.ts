import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { _defineDirective, _getDirective } from './directive-registry.util';

class FirstDirective extends CustomDirective {
  public onInit(): undefined {
    return;
  }
}

class SecondDirective extends CustomDirective {
  public onInit(): undefined {
    return;
  }
}

describe('directive registry', () => {
  it('returns the directive registered for a selector', () => {
    _defineDirective('registered', FirstDirective);

    expect(_getDirective('registered')).toBe(FirstDirective);
  });

  it('throws when the same directive is registered again under its selector', () => {
    _defineDirective('re-registered', FirstDirective);

    expect(() => _defineDirective('re-registered', FirstDirective)).toThrow('Selector "re-registered" is already used by directive FirstDirective');
  });

  it('throws when the selector is already used by another directive', () => {
    _defineDirective('duplicated', FirstDirective);

    expect(() => _defineDirective('duplicated', SecondDirective)).toThrow('Selector "duplicated" is already used by directive FirstDirective');
  });

  it('returns undefined when no directive is registered for the selector', () => {
    expect(_getDirective('missing')).toBeUndefined();
  });
});
