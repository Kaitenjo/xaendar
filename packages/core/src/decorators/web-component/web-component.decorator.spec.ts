// @vitest-environment happy-dom
import { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { BaseWebComponent } from '../../directives/base-web-component';
import { WebComponent } from './web-component.decorator';

function decorate(selector: string, klass: Constructor<BaseWebComponent>): void {
  WebComponent({ selector, templateUrl: './x.html' })(klass, {} as ClassDecoratorContext<Constructor<BaseWebComponent>>);
}

describe('WebComponent decorator', () => {
  it('registers the class under its selector', () => {
    class Single extends BaseWebComponent { }
    decorate('x-single', Single);

    expect(customElements.get('x-single')).toBe(Single);
  });

  it('throws when the selector is already used by another component', () => {
    decorate('x-duplicated', class extends BaseWebComponent { });

    expect(() => decorate('x-duplicated', class extends BaseWebComponent { })).toThrow();
  });
});
