import { describe, expect, it, vi } from 'vitest';
import type { _Context } from '../context/context.util';
import { captureContext, closeTryScope, connectChild, isInTryScope, openTryScope, runConnection } from './try-scope.util';

const context = (name: string) => ({ name }) as unknown as _Context;

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
    it('mounts the element, the error of its component going through, outside of a @try', () => {
      const failure = new Error('child');

      expect(() => connectChild(() => runConnection(() => {
        throw failure;
      }))).toThrow(failure);
    });

    it('throws the error of the component once the element is mounted, inside a @try, whatever is thrown', () => {
      const scope = openTryScope();
      const steps = new Array<string>();

      try {
        let thrown: unknown = 'nothing';
        try {
          connectChild(() => {
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
        expect(() => connectChild(() => runConnection(() => steps.push('connected')))).not.toThrow();
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
        connectChild(() => runConnection(() => {
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
