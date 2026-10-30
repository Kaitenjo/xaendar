// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { _defineDirective } from '../directive-registry/directive-registry.util';
import { _resolveDirective } from './resolve-directive.util';

class TooltipDirective extends CustomDirective { }

class GuardDirective extends StructuralDirective {
  public shouldRender(): boolean {
    return true;
  }
}

_defineDirective('resolvedTooltip', TooltipDirective);
_defineDirective('resolvedGuard', GuardDirective);

describe('_resolveDirective', () => {
  it('returns the directive registered for a selector, of the expected kind', () => {
    expect(_resolveDirective('resolvedTooltip', CustomDirective)).toBe(TooltipDirective);
    expect(_resolveDirective('resolvedGuard', StructuralDirective)).toBe(GuardDirective);
  });

  it('returns the class given in place of a selector', () => {
    expect(_resolveDirective(TooltipDirective, CustomDirective)).toBe(TooltipDirective);
  });

  it('throws when no directive is registered for the selector', () => {
    expect(() => _resolveDirective('unregistered', CustomDirective)).toThrow('No directive registered for selector "unregistered"');
  });

  it('throws when the directive is not of the expected kind', () => {
    expect(() => _resolveDirective('resolvedGuard', CustomDirective)).toThrow('Directive GuardDirective registered for selector "resolvedGuard" is not a CustomDirective');
    expect(() => _resolveDirective(TooltipDirective, StructuralDirective)).toThrow('Directive TooltipDirective is not a StructuralDirective');
  });
});
