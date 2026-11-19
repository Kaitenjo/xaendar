import { describe, expect, it, vi } from 'vitest';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { _Context } from '../../types/context.type';
import { captureContext, closeTryScope, connectChild, isInTryScope, openTryScope, runConnection } from './try-scope.util';

const context = (name: string) => ({ name }) as unknown as _Context;

const element = { localName: 'x-child' } as unknown as Element;

const parentNode = { localName: 'div' } as unknown as Element;

/**
 * Mounts the element with a strategy whose `mount` runs a function.
 */
const mountWith = (mount: () => unknown) => connectChild({ mount } as unknown as NodeStrategy, element, parentNode, null);

describe('try scope', () => {
  describe('openTryScope', () => {
    it('collects the contexts created until it is closed, in the scopes holding it too', () => {
      expect(isInTryScope()).toBe(false);
      const outer = openTryScope();
      const first = context('first');
      captureContext(first);
      const inner = openTryScope();
      const second = context('second');
      captureContext(second);
      closeTryScope(inner);
      const third = context('third');
      captureContext(third);
      expect(isInTryScope()).toBe(true);
      closeTryScope(outer);
      captureContext(context('after'));

      expect(isInTryScope()).toBe(false);
      expect(inner.contexts).toEqual([second]);
      expect(outer.contexts).toEqual([first, second, third]);
    });
  });

  describe('connectChild', () => {
    it('mounts the element with the strategy it was got with, inside and outside of a @try', () => {
      const mount = vi.fn();
      const anchor = { nodeType: 8 } as unknown as Comment;
      connectChild({ mount } as unknown as NodeStrategy, element, parentNode, anchor);
      const scope = openTryScope();
      try {
        connectChild({ mount } as unknown as NodeStrategy, element, parentNode, null);
      } finally {
        closeTryScope(scope);
      }

      expect(mount.mock.calls).toEqual([[element, parentNode, anchor], [element, parentNode, null]]);
    });

    it('mounts the element, the error of its component going through, outside of a @try', () => {
      const failure = new Error('child');

      expect(() => mountWith(() => runConnection(() => {
        throw failure;
      }))).toThrow(failure);
    });

    it('throws the error of the component once the element is mounted, inside a @try, whatever is thrown', () => {
      const scope = openTryScope();
      const steps = new Array<string>();

      try {
        let thrown: unknown = 'nothing';
        try {
          mountWith(() => {
            runConnection(() => {
              throw undefined;
            });
            steps.push('mounted');
          });
        } catch (error) {
          thrown = error;
        }

        expect(steps).toEqual(['mounted']);
        expect(thrown).toBeUndefined();
        expect(() => mountWith(() => runConnection(() => steps.push('connected')))).not.toThrow();
        expect(steps).toEqual(['mounted', 'connected']);
      } finally {
        closeTryScope(scope);
      }
    });
  });

  describe('runConnection', () => {
    it('runs a component mounted by a template inside the @try, and one inserted by its code outside of it', () => {
      const scope = openTryScope();
      const failure = new Error('inserted by code');
      const inside = vi.fn(() => isInTryScope());

      try {
        mountWith(() => runConnection(() => {
          inside();
          // A component the code of this one inserts by itself
          expect(() => runConnection(() => {
            inside();
            throw failure;
          })).toThrow(failure);
          inside();
        }));
      } finally {
        closeTryScope(scope);
      }

      expect(inside.mock.results.map(result => result.value)).toEqual([true, false, true]);
    });
  });
});
