import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GLOBAL_STATE } from '../../globals';
import { PRIVATE } from '../../private-symbol';
import { Computed } from '../computed/computed';
import { State } from '../state/state';
import { Watcher } from './watcher';

beforeEach(() => {
  GLOBAL_STATE.frozen = false;
  GLOBAL_STATE.computing = null;
});

function makeState<T>(value: T) { return new State(value); }
function makeComputed<T>(cb: () => T) { return new Computed(cb); }
function makeWatcher(cb = vi.fn()) { return { watcher: new Watcher(cb), cb }; }

describe('Watcher', () => {

  describe('constructor', () => {
    it('starts in ~waiting~ state', () => {
      const { watcher } = makeWatcher();
      expect(watcher.getState(PRIVATE)).toBe('waiting');
    });

    it('starts with no sources', () => {
      const { watcher } = makeWatcher();
      expect(watcher.getSources(PRIVATE)).toHaveLength(0);
    });
  });

  describe('watch()', () => {
    it('transitions to ~watching~ after the first watch call', () => {
      const { watcher } = makeWatcher();
      watcher.watch(makeState(1));
      expect(watcher.getState(PRIVATE)).toBe('watching');
    });

    it('adds signals to the sources set', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      expect(watcher.getSources(PRIVATE)).toContain(state);
    });

    it('can watch multiple signals at once', () => {
      const { watcher } = makeWatcher();
      const state1 = makeState(1);
      const state2 = makeState(2);
      watcher.watch(state1, state2);
      expect(watcher.getSources(PRIVATE)).toEqual(expect.arrayContaining([state1, state2]));
    });

    it('registers itself as a sink of the watched signal', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      expect(state.getSinks(PRIVATE)).toContain(watcher);
    });

    it('throws when trying to watch an already-watched signal', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      expect(() => watcher.watch(state)).toThrow();
    });

    it('throws when called while frozen', () => {
      GLOBAL_STATE.frozen = true;
      const { watcher } = makeWatcher();
      expect(() => watcher.watch(makeState(1))).toThrow('frozen');
    });

    it('can watch a Computed signal', () => {
      const { watcher } = makeWatcher();
      const c = makeComputed(() => 1);
      watcher.watch(c);
      expect(watcher.getSources(PRIVATE)).toContain(c);
    });
  });

  describe('unwatch()', () => {
    it('removes the signal from the sources set', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      watcher.unwatch(state);
      expect(watcher.getSources(PRIVATE)).not.toContain(state);
    });

    it('transitions back to ~waiting~ when all signals are unwatched', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      watcher.unwatch(state);
      expect(watcher.getState(PRIVATE)).toBe('waiting');
    });

    it('stays ~watching~ when other signals remain', () => {
      const { watcher } = makeWatcher();
      const state1 = makeState(1);
      const state2 = makeState(2);
      watcher.watch(state1, state2);
      watcher.unwatch(state1);
      expect(watcher.getState(PRIVATE)).toBe('watching');
    });

    it('removes itself from the signal sinks', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      watcher.unwatch(state);
      expect(state.getSinks(PRIVATE)).not.toContain(watcher);
    });

    it('throws when trying to unwatch a signal that is not being watched', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      expect(() => watcher.unwatch(state)).toThrow();
    });

    it('throws when called while frozen', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      GLOBAL_STATE.frozen = true;
      expect(() => watcher.unwatch(state)).toThrow('frozen');
    });
  });

  describe('notify()', () => {
    it('rejects calls without the private symbol', () => {
      const { watcher } = makeWatcher();
      expect(() => watcher.notify(Symbol('x'))).toThrow();
    });

    it('invokes the notify callback', () => {
      const cb = vi.fn();
      const { watcher } = makeWatcher(cb);
      watcher.watch();
      watcher.notify(PRIVATE);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('calls the notify callback with the Watcher as `this`', () => {
      let thisRef: unknown;
      const cb = vi.fn(function (this: unknown) { thisRef = this; });
      const { watcher } = makeWatcher(cb);
      watcher.watch();
      watcher.notify(PRIVATE);
      expect(thisRef).toBe(watcher);
    });

    it('freezes the global state while the callback runs', () => {
      let frozenDuring = false;
      const cb = vi.fn(() => { frozenDuring = GLOBAL_STATE.frozen; });
      const { watcher } = makeWatcher(cb);
      watcher.watch();
      watcher.notify(PRIVATE);
      expect(frozenDuring).toBe(true);
    });

    it('unfreezes after the callback, even if it throws', () => {
      const cb = vi.fn(() => { throw new Error('boom'); });
      const { watcher } = makeWatcher(cb);
      watcher.watch();
      expect(() => watcher.notify(PRIVATE)).toThrow('boom');
      expect(GLOBAL_STATE.frozen).toBe(false);
    });

    it('transitions to ~watching~ after the callback runs', () => {
      const { watcher } = makeWatcher();
      watcher.watch(makeState(1));
      watcher.notify(PRIVATE);
      expect(watcher.getState(PRIVATE)).toBe('watching');
    });

    it('is called when a watched State changes', () => {
      const cb = vi.fn();
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);
      watcher.watch(state);

      cb.mockClear();
      state.set(2);
      expect(cb).toHaveBeenCalledOnce();
    });

    it('is called twice for multiple State changes (transitions to waiting after first)', () => {
      const cb = vi.fn();
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);
      watcher.watch(state);

      // After the first set, watcher goes ~waiting~ → subsequent sets don't
      // re-trigger notify until watch() is called again.
      cb.mockClear();
      state.set(2);
      state.set(3);
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('is called when a watched Computed dependency changes', () => {
      const cb = vi.fn();
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);
      const computed = makeComputed(() => state.get());
      watcher.watch(computed);
      computed.get();

      cb.mockClear();
      state.set(2);
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe('getPending()', () => {
    it('returns an empty array when nothing is dirty or checked', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      const c = makeComputed(() => state.get());
      watcher.watch(c);
      c.get();
      expect(watcher.getPending()).toHaveLength(0);
    });

    it('returns dirty Computed signals', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      const c = makeComputed(() => state.get());
      watcher.watch(c);
      c.get();

      state.set(2); // c becomes dirty
      expect(watcher.getPending()).toContain(c);
    });

    it('returns checked Computed signals', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      const middle = makeComputed(() => state.get());
      const top = makeComputed(() => middle.get());
      watcher.watch(top);
      top.get();

      state.set(2); // middle dirty, top checked
      expect(watcher.getPending()).toContain(top);
    });

    it('does not return State signals', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      watcher.watch(state);
      state.set(2);
      // getPending filters only Computed instances
      expect(watcher.getPending().every(p => p instanceof Computed)).toBe(true);
    });

    it('does not return clean Computed signals', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      const c = makeComputed(() => Math.sign(state.get())); // always 1 for positive
      watcher.watch(c);
      c.get();

      state.set(5); // c re-evaluates to same value → stays/becomes clean
      c.get();  // pull to resolve
      expect(watcher.getPending()).not.toContain(c);
    });
  });

  describe('getState() / setState()', () => {
    it('rejects calls with wrong symbol', () => {
      const { watcher } = makeWatcher();
      expect(() => watcher.getState(Symbol('x'))).toThrow();
      expect(() => watcher.setState('watching', Symbol('x'))).toThrow();
    });

    it('allows valid transition: waiting → watching', () => {
      const { watcher } = makeWatcher();
      watcher.setState('watching', PRIVATE);
      expect(watcher.getState(PRIVATE)).toBe('watching');
    });

    it('allows valid transition: watching → waiting', () => {
      const { watcher } = makeWatcher();
      watcher.setState('watching', PRIVATE);
      watcher.setState('waiting', PRIVATE);
      expect(watcher.getState(PRIVATE)).toBe('waiting');
    });

    it('ignores invalid transitions silently', () => {
      const { watcher } = makeWatcher(); // waiting
      watcher.setState('pending', PRIVATE); // waiting → pending is invalid
      expect(watcher.getState(PRIVATE)).toBe('waiting');
    });
  });

  describe('getSources()', () => {
    it('rejects calls with wrong symbol', () => {
      const { watcher } = makeWatcher();
      expect(() => watcher.getSources(Symbol('x'))).toThrow();
    });

    it('returns a snapshot, not a live reference', () => {
      const { watcher } = makeWatcher();
      const snapshot = watcher.getSources(PRIVATE);
      watcher.watch(makeState(1));
      expect(snapshot).toHaveLength(0);
    });
  });

  describe('integration', () => {
    it('full lifecycle: watch → notify → unwatch', () => {
      const events: string[] = [];
      const cb = vi.fn(() => events.push('notify'));
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);

      watcher.watch(state);
      events.push('watching');

      state.set(2);
      events.push('after-set');

      watcher.unwatch(state);
      events.push('unwatched');

      expect(events).toEqual(['watching', 'notify', 'after-set', 'unwatched']);
    });

    it('does not notify after unwatch', () => {
      const cb = vi.fn();
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);
      watcher.watch(state);
      watcher.unwatch(state);

      cb.mockClear();
      state.set(2);
      expect(cb).not.toHaveBeenCalled();
    });

    it('getPending() is usable inside a notify callback to schedule pulls', () => {
      const pending: Computed<unknown>[] = [];
      const cb = vi.fn(function (this: Watcher) {
        pending.push(...this.getPending());
      });
      const { watcher } = makeWatcher(cb);
      const state = makeState(1);
      const c = makeComputed(() => state.get());
      watcher.watch(c);
      c.get();

      state.set(2);
      expect(pending).toContain(c);
    });

    it('watching a Computed builds the full dependency chain up to State', () => {
      const { watcher } = makeWatcher();
      const state = makeState(1);
      const computed = makeComputed(() => state.get());
      watcher.watch(computed);
      computed.get();

      // s should have c as a sink (chain built)
      expect(state.getSinks(PRIVATE)).toContain(computed);
    });
  });
});