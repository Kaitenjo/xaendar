// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { WebComponent } from './web-component.decorator';

type Decorate = (klass: unknown, context: unknown) => void;

function decorate(selector: string | string[], klass: CustomElementConstructor): void {
  (WebComponent({ selector, templateUrl: './x.html' }) as unknown as Decorate)(klass, {});
}

describe('WebComponent decorator', () => {
  it('registers the class under a single selector', () => {
    class Single extends HTMLElement { }
    decorate('x-single', Single);

    expect(customElements.get('x-single')).toBe(Single);
  });

  it('registers the class under every selector of an array', () => {
    const define = vi.spyOn(customElements, 'define').mockImplementation(() => { });
    class Multi extends HTMLElement { }
    decorate(['x-multi-a', 'x-multi-b'], Multi);

    expect(define).toHaveBeenCalledTimes(2);
    expect(define).toHaveBeenNthCalledWith(1, 'x-multi-a', Multi);
    expect(define).toHaveBeenNthCalledWith(2, 'x-multi-b', Multi);
    define.mockRestore();
  });

  it('does not register anything for an empty selectors array', () => {
    expect(() => decorate([], class extends HTMLElement { })).not.toThrow();
  });
});
