// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { CONTAINER_SLOTS, DIRECTIVE_CONNECT, HEADER, LEAVE_HANDLER, SET_DIRECTIVE_ELEMENT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import { _scope, clear, containerSlot, ELEMENT_LAYOUT, trackNode } from '../context/context.util';
import { onLeave } from '../on-leave/on-leave.util';
import { registerLeave, startDirective } from './leave.util';

loadSignals();

/**
 * The layout of a scope holding a block.
 */
const HOLDER: _ScopeLayout = { size: HEADER + CONTAINER_SLOTS, nodes: HEADER, containers: HEADER };

/**
 * Renders an element at the top of a scope held by another one, as the branch of a block.
 */
function render() {
  const holder = _scope(null, HOLDER);
  const scope = _scope(holder, ELEMENT_LAYOUT);
  holder[containerSlot(holder)] = scope;
  const parent = document.createElement('div');
  const element = parent.appendChild(document.createElement('p'));
  trackNode(element, parent, scope, HEADER);
  return { holder, scope, parent, element };
}

describe('registerLeave', () => {
  it('registers the handler on the element, a second registration replacing the first, and marks the scope of the directive starting', () => {
    const { holder, scope, parent, element } = render();
    const first = vi.fn();
    const second = vi.fn(() => new Promise<void>(() => undefined));

    const previous = startDirective(scope);
    registerLeave(element, first);
    registerLeave(element, second);
    startDirective(previous);
    clear(scope, true, holder);

    expect((element as Element & Partial<Record<typeof LEAVE_HANDLER, unknown>>)[LEAVE_HANDLER]).toBe(second);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(element);
    expect(element.parentNode).toBe(parent);
    clear(holder);
  });

  it('gives back the scope of the directive starting before, put back once the one starting has started', () => {
    const outer = _scope(null, ELEMENT_LAYOUT);
    const inner = _scope(null, ELEMENT_LAYOUT);

    expect(startDirective(outer)).toBeNull();
    expect(startDirective(inner)).toBe(outer);
    expect(startDirective(outer)).toBe(inner);
    expect(startDirective(null)).toBe(outer);
  });
});

describe('onLeave from a directive', () => {
  /**
   * A directive leaving with a handler it registers in its `onInit`, throwing after it when told to.
   */
  class LeavingDirective extends CustomDirective {
    public readonly handler = vi.fn(() => new Promise<void>(() => undefined));
    public fails = false;

    public onInit(): void {
      onLeave(this.element, this.handler);
      if (this.fails) {
        throw new Error('boom');
      }
    }
  }

  it('marks the scope the directive starts in, and leaves no scope starting once it has started, even when onInit throws', () => {
    const { holder, scope, parent, element } = render();
    const directive = new LeavingDirective();
    directive[SET_DIRECTIVE_ELEMENT] = element;
    const failing = new LeavingDirective();
    failing.fails = true;
    failing[SET_DIRECTIVE_ELEMENT] = document.createElement('i');

    directive[DIRECTIVE_CONNECT](scope);
    expect(() => failing[DIRECTIVE_CONNECT](_scope(null, ELEMENT_LAYOUT))).toThrow('boom');
    clear(scope, true, holder);

    expect(startDirective(null)).toBeNull();
    expect(directive.handler).toHaveBeenCalledExactlyOnceWith(element);
    expect(element.parentNode).toBe(parent);
    clear(holder);
  });
});
