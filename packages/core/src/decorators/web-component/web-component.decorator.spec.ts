// @vitest-environment happy-dom
import { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { CustomElement } from '../../models/custom-element/custom-element';
import { WebComponent } from './web-component.decorator';

function decorate(selector: string, klass: Constructor<CustomElement>): void {
  WebComponent({ selector, templateUrl: './x.html' })(klass, {} as ClassDecoratorContext<Constructor<CustomElement>>);
}

describe('WebComponent decorator', () => {
  it('registers the class under its selector', () => {
    class Single extends CustomElement { }
    decorate('x-single', Single);

    expect(customElements.get('x-single')).toBe(Single);
  });

  it('throws when the selector is already used by another component', () => {
    decorate('x-duplicated', class extends CustomElement { });

    expect(() => decorate('x-duplicated', class extends CustomElement { })).toThrow();
  });
});
