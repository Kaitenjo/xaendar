import { describe, expect, it, vi } from 'vitest';
import { _collectEffects, _registerEffect, _runOutsideEffectScope } from './effect-scope.util';

describe('effect scope', () => {
  describe('_registerEffect', () => {
    it('returns the disposer untouched when no scope is active', () => {
      const disposer = vi.fn();

      expect(_registerEffect(disposer)).toBe(disposer);
    });

    it('collects the disposers registered while the scope is active', () => {
      const disposer = vi.fn();

      const { disposers } = _collectEffects(() => _registerEffect(disposer));

      expect(disposers).toHaveLength(1);
      expect(disposer).not.toHaveBeenCalled();
      disposers[0]();
      expect(disposer).toHaveBeenCalledOnce();
    });

    it('hands the user the same safe disposer it collects, which runs the original only once', () => {
      const disposer = vi.fn();

      const { result, disposers } = _collectEffects(() => _registerEffect(disposer));

      expect(result).toBe(disposers[0]);
      result();
      disposers[0]();
      expect(disposer).toHaveBeenCalledOnce();
    });

    it('stops collecting once the scope is over', () => {
      const { disposers } = _collectEffects(() => undefined);
      const disposer = vi.fn();

      expect(_registerEffect(disposer)).toBe(disposer);
      expect(disposers).toHaveLength(0);
    });
  });

  describe('_collectEffects', () => {
    it('returns the value of the function', () => {
      expect(_collectEffects(() => 42).result).toBe(42);
    });

    it('restores the outer scope after a nested one', () => {
      const inner = vi.fn();
      const outer = vi.fn();

      const { disposers: outerDisposers } = _collectEffects(() => {
        const { disposers: innerDisposers } = _collectEffects(() => _registerEffect(inner));
        _registerEffect(outer);

        expect(innerDisposers).toHaveLength(1);
      });

      expect(outerDisposers).toHaveLength(1);
      outerDisposers[0]();
      expect(outer).toHaveBeenCalledOnce();
      expect(inner).not.toHaveBeenCalled();
    });

    it('disposes the effects created so far and rethrows when the function throws', () => {
      const disposer = vi.fn();
      const error = new Error('boom');

      expect(() => _collectEffects(() => {
        _registerEffect(disposer);
        throw error;
      })).toThrow(error);

      expect(disposer).toHaveBeenCalledOnce();
      const other = vi.fn();
      expect(_registerEffect(other)).toBe(other);
    });
  });

  describe('_runOutsideEffectScope', () => {
    it('returns the value of the function', () => {
      expect(_runOutsideEffectScope(() => 42)).toBe(42);
    });

    it('does not collect the effects created inside it, and restores the scope afterwards', () => {
      const inside = vi.fn();
      const after = vi.fn();

      const { disposers } = _collectEffects(() => {
        _runOutsideEffectScope(() => {
          expect(_registerEffect(inside)).toBe(inside);
        });
        _registerEffect(after);
      });

      expect(disposers).toHaveLength(1);
      disposers[0]();
      expect(after).toHaveBeenCalledOnce();
      expect(inside).not.toHaveBeenCalled();
    });

    it('restores the scope when the function throws', () => {
      const disposer = vi.fn();

      const { disposers } = _collectEffects(() => {
        expect(() => _runOutsideEffectScope(() => { throw new Error('boom'); })).toThrow('boom');
        _registerEffect(disposer);
      });

      expect(disposers).toHaveLength(1);
    });
  });
});
