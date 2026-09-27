// @vitest-environment happy-dom
import { BaseWebComponent } from '@xaendar/core';
import { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { WebComponent } from './web-component.decorator';

function decorate(selector: string | string[], klass: Constructor<BaseWebComponent>): void {
  WebComponent({ selector, templateUrl: './x.html' })(klass, {} as ClassDecoratorContext<Constructor<BaseWebComponent>>);
}

describe('WebComponent decorator', () => {
  it('registers the class under a single selector', () => {
    class Single extends BaseWebComponent { }
    decorate('x-single', Single);

    expect(customElements.get('x-single')).toBe(Single);
  });

  it('registers the class under every selector of an array', () => {
    const define = vi.spyOn(customElements, 'define').mockImplementation(() => { });
    class Multi extends BaseWebComponent { }
    decorate(['x-multi-a', 'x-multi-b'], Multi);

    expect(define).toHaveBeenCalledTimes(2);
    expect(define).toHaveBeenNthCalledWith(1, 'x-multi-a', Multi);
    expect(define).toHaveBeenNthCalledWith(2, 'x-multi-b', Multi);
    define.mockRestore();
  });

  it('does not register anything for an empty selectors array', () => {
    expect(() => decorate([], class extends BaseWebComponent { })).not.toThrow();
  });
});
