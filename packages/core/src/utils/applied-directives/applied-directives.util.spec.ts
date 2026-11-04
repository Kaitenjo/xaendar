// @vitest-environment happy-dom
import type { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { _addAppliedDirective, _getAppliedDirectives, _removeAppliedDirective } from './applied-directives.util';

class Tooltip extends CustomDirective { }
class RichTooltip extends Tooltip { }
class Other extends CustomDirective { }

/**
 * Creates a component holding the given host directives: an instance of `CustomElement`, built without running its
 * constructor, which would create the host directives declared by `@WebComponent`.
 */
function withHostDirectives(...directives: CustomDirective[]): Element {
  const hostDirectives = new Map(directives.map(directive => [directive.constructor as Constructor<CustomDirective>, directive]));
  return Object.assign(Object.create(CustomElement.prototype) as CustomElement, { hostDirectives: hostDirectives as unknown as HostDirectives });
}

describe('applied directives', () => {
  it('finds nothing on an element no directive is applied to', () => {
    expect(_getAppliedDirectives(document.createElement('div'), Tooltip)).toBeUndefined();
    expect(_getAppliedDirectives(withHostDirectives(), Tooltip)).toBeUndefined();
  });

  it('finds the directives of the class, and of its subclasses, applied by a template, in order', () => {
    const element = document.createElement('div');
    const [rich, other, tooltip] = [new RichTooltip(), new Other(), new Tooltip()];
    _addAppliedDirective(element, rich);
    _addAppliedDirective(element, other);
    _addAppliedDirective(element, tooltip);

    expect(_getAppliedDirectives(element, Tooltip)).toEqual([rich, tooltip]);
    expect(_getAppliedDirectives(element, Other)).toEqual([other]);
  });

  it('finds the host directives of a component first', () => {
    const host = new Tooltip();
    const element = withHostDirectives(new Other(), host);
    const applied = new RichTooltip();
    _addAppliedDirective(element, applied);

    expect(_getAppliedDirectives(element, Tooltip)).toEqual([host, applied]);
  });

  it('forgets a directive once it is removed', () => {
    const element = document.createElement('div');
    const [first, second] = [new Tooltip(), new Tooltip()];
    _addAppliedDirective(element, first);
    _addAppliedDirective(element, second);

    _removeAppliedDirective(element, first);
    expect(_getAppliedDirectives(element, Tooltip)).toEqual([second]);

    _removeAppliedDirective(element, second);
    expect(_getAppliedDirectives(element, Tooltip)).toBeUndefined();
  });
});
