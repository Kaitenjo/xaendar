// @vitest-environment happy-dom
import { KEY_MODIFIERS } from '@xaendar/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _isKey } from '../key-event/key-event.util';
import { _EVENT_CONTRACT_KEY, WAITS_FOR_HYDRATION } from '../../costants';
import { _scope, EMPTY_LAYOUT } from '../context/context.util';
import type { _Context } from '../../types/context.type';
import { armTriggers, deferElementHydration, recordEvents, replayContractEvents, replayElementEvents, replayEvents, toIdle, waitedForTrigger, watchedTriggers } from './hydration-triggers.util';

/**
 * The IntersectionObserver standing for the one of the browser: `intersect` calls the callback of the last one created.
 */
class FakeIntersectionObserver {
  public static last: FakeIntersectionObserver;
  public readonly observed = new Array<Element>();
  public disconnected = false;

  constructor(private readonly _callback: (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void, public readonly options?: IntersectionObserverInit) {
    FakeIntersectionObserver.last = this;
  }

  public observe(element: Element): void {
    this.observed.push(element);
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  public intersect(...isIntersecting: boolean[]): void {
    this._callback(isIntersecting.map(value => ({ isIntersecting: value })));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('armTriggers', () => {
  it('fires load once the code running now is done, once', () => {
    const fire = vi.fn();

    armTriggers(['load'], [], fire);
    expect(fire).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(fire).toHaveBeenCalledOnce();
  });

  it('fires idle when the browser is idle, after a timeout where requestIdleCallback is missing', () => {
    const idle = vi.fn((_callback: IdleRequestCallback) => 7);
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', cancel);
    const fire = vi.fn();

    armTriggers(['idle'], [], fire);
    idle.mock.calls[0][0]({} as IdleDeadline);
    expect(fire).toHaveBeenCalledOnce();

    cancel.mockClear();
    armTriggers(['idle'], [], fire)();
    expect(cancel).toHaveBeenCalledWith(7);

    vi.stubGlobal('requestIdleCallback', undefined);
    armTriggers(['idle'], [], fire);
    vi.runAllTimers();
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it('fires idle at the latest once the time it declares has passed', () => {
    const idle = vi.fn((_callback: IdleRequestCallback, _options?: IdleRequestOptions) => 7);
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', vi.fn());

    armTriggers([{ kind: 'idle', timeout: 500 }], [], vi.fn());

    expect(idle.mock.calls[0][1]).toEqual({ timeout: 500 });
  });

  it('fires timer once its time has passed', () => {
    const fire = vi.fn();

    armTriggers([{ kind: 'timer', delay: 500 }], [], fire);
    vi.advanceTimersByTime(499);
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledOnce();

    armTriggers([{ kind: 'timer', delay: 500 }], [], fire)();
    vi.runAllTimers();
    expect(fire).toHaveBeenCalledOnce();
  });

  it('fires hover when the pointer moves over one of the elements or the focus enters it, before the listeners inside it', () => {
    const element = document.body.appendChild(document.createElement('div'));
    const button = element.appendChild(document.createElement('button'));
    const order = new Array<string>();
    button.addEventListener('mouseover', () => order.push('handler'));
    const fire = vi.fn(() => order.push('fire'));

    armTriggers(['hover'], [element], fire);
    button.dispatchEvent(new Event('mouseover', { bubbles: true }));
    expect(order).toEqual(['fire', 'handler']);

    armTriggers(['hover'], [element], fire);
    button.dispatchEvent(new Event('focusin', { bubbles: true }));
    button.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(fire).toHaveBeenCalledTimes(2);
  });

  it('watches the element a trigger names in place of the elements, with the options of the observer of visible', () => {
    const elements = [document.createElement('p')];
    const named = document.body.appendChild(document.createElement('button'));
    const fire = vi.fn();

    armTriggers([{ kind: 'visible', target: () => named, options: { rootMargin: '10px' } }], elements, fire);
    expect(FakeIntersectionObserver.last.observed).toEqual([named]);
    expect(FakeIntersectionObserver.last.options).toEqual({ rootMargin: '10px' });

    armTriggers([{ kind: 'visible', options: { threshold: 1 } }], elements, fire);
    expect(FakeIntersectionObserver.last.observed).toEqual(elements);
    expect(FakeIntersectionObserver.last.options).toEqual({ threshold: 1 });

    armTriggers([{ kind: 'interaction', target: () => named }], elements, fire);
    elements[0].click();
    expect(fire).not.toHaveBeenCalled();
    named.click();
    expect(fire).toHaveBeenCalledOnce();
  });

  it('reads the element a trigger names and the options of visible with the component and the context of the block, once armed', () => {
    const named = document.body.appendChild(document.createElement('button'));
    const component = { named, margin: '20px' };
    const context = _scope(null, EMPTY_LAYOUT, undefined, component);
    const target = vi.fn(function (this: typeof component, _context: _Context) {
      return this.named;
    });
    const options = vi.fn(function (this: typeof component, _context: _Context) {
      return { rootMargin: this.margin };
    });

    armTriggers([{ kind: 'visible', target, options }], [], vi.fn(), context);

    expect(FakeIntersectionObserver.last.observed).toEqual([named]);
    expect(FakeIntersectionObserver.last.options).toEqual({ rootMargin: '20px' });
    expect(target.mock.contexts[0]).toBe(component);
    expect(target.mock.calls[0][0]).toBe(context);
    expect(options.mock.contexts[0]).toBe(component);
    expect(options.mock.calls[0][0]).toBe(context);
  });

  it('observes with the options of visible given as an object, with the context of the block', () => {
    const elements = [document.createElement('p')];

    armTriggers([{ kind: 'visible', options: { threshold: 0.5 } }], elements, vi.fn(), { component: {} } as unknown as _Context);

    expect(FakeIntersectionObserver.last.observed).toEqual(elements);
    expect(FakeIntersectionObserver.last.options).toEqual({ threshold: 0.5 });
  });

  it('fires visible when one of the elements enters the viewport', () => {
    const elements = [document.createElement('p'), document.createElement('b')];
    const fire = vi.fn();

    armTriggers(['visible'], elements, fire);
    const observer = FakeIntersectionObserver.last;
    expect(observer.observed).toEqual(elements);
    observer.intersect(false, false);
    expect(fire).not.toHaveBeenCalled();
    observer.intersect(false, true);
    expect(fire).toHaveBeenCalledOnce();
    expect(observer.disconnected).toBe(true);
  });

  it('fires interaction at the first event on one of the elements, then stops listening', () => {
    const element = document.body.appendChild(document.createElement('button'));
    const fire = vi.fn();

    armTriggers(['interaction'], [element], fire);
    element.dispatchEvent(new Event('focusin'));
    element.dispatchEvent(new Event('click'));

    expect(fire).toHaveBeenCalledOnce();
  });

  it('fires interaction once the listeners inside the element have handled the event', () => {
    const element = document.body.appendChild(document.createElement('div'));
    const button = element.appendChild(document.createElement('button'));
    const order = new Array<string>();
    button.addEventListener('click', () => order.push('handler'));

    armTriggers(['interaction'], [element], () => order.push('fire'));
    button.dispatchEvent(new Event('click', { bubbles: true }));

    expect(order).toEqual(['handler', 'fire']);
  });

  it('fires once, at the first trigger firing, disarming the other ones, and nothing once disarmed', () => {
    const element = document.body.appendChild(document.createElement('button'));
    const fire = vi.fn();

    armTriggers(['interaction', 'load'], [element], fire);
    element.click();
    vi.runAllTimers();
    expect(fire).toHaveBeenCalledOnce();

    armTriggers(['interaction', 'load'], [element], fire)();
    element.click();
    vi.runAllTimers();
    expect(fire).toHaveBeenCalledOnce();
  });
});

describe('toIdle', () => {
  it('waits for the browser to be idle in place of a trigger watching elements, keeping the others', () => {
    expect((['visible', 'interaction', 'hover', 'load', 'idle', 'never'] as const).map(toIdle)).toEqual(['idle', 'idle', 'idle', 'load', 'idle', 'never']);
    expect(toIdle({ kind: 'visible', options: { threshold: 1 } })).toBe('idle');
  });

  it('keeps the triggers naming the element they watch, and the ones watching none', () => {
    const triggers = [
      { kind: 'hover', target: () => document.body },
      { kind: 'idle', timeout: 1 },
      { kind: 'timer', delay: 1 }
    ] as const;

    expect(triggers.map(toIdle)).toEqual(triggers);
  });
});

describe('watchedTriggers', () => {
  it('keeps the triggers when there are elements to watch, and waits for the browser to be idle in place of the ones watching them otherwise', () => {
    const triggers = ['visible', 'load'] as const;

    expect(watchedTriggers(triggers, [document.createElement('p')])).toBe(triggers);
    expect(watchedTriggers(triggers, [])).toEqual(['idle', 'load']);
  });
});

describe('recordEvents', () => {
  it('records the events on the targets, stopping them, preventing a submit, until it is stopped', () => {
    const form = document.body.appendChild(document.createElement('form'));
    const button = form.appendChild(document.createElement('button'));
    button.type = 'button';
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    const onEvent = vi.fn();

    const recorded = recordEvents([form], onEvent);
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(onClick).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(recorded.events.map(({ event, target }) => [event.type, target, event.defaultPrevented])).toEqual([['submit', form, true], ['click', button, false]]);

    recorded.stop();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(recorded.events).toHaveLength(2);
  });
});

describe('replayEvents', () => {
  it('stops recording and replays the events on their targets still in the document, their default action prevented', () => {
    const parent = document.body.appendChild(document.createElement('div'));
    const button = parent.appendChild(document.createElement('button'));
    const removed = parent.appendChild(document.createElement('input'));
    const recorded = recordEvents([parent], () => undefined);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 4 }));
    removed.dispatchEvent(new Event('input', { bubbles: true }));
    removed.remove();
    const replayed = new Array<Event>();
    parent.addEventListener('click', event => replayed.push(event));
    parent.addEventListener('input', event => replayed.push(event));

    replayEvents(recorded);

    expect(replayed).toHaveLength(1);
    expect(replayed[0]).toBeInstanceOf(MouseEvent);
    expect((replayed[0] as MouseEvent).clientX).toBe(4);
    expect(replayed[0].defaultPrevented).toBe(true);
    expect(recorded.events).toHaveLength(0);
    button.click();
    expect(replayed).toHaveLength(2);
    expect(replayed[1].defaultPrevented).toBe(false);
  });

  it('replays a keyboard event with its key, its code and its modifiers, which the listeners of the key events test', () => {
    const input = document.body.appendChild(document.createElement('input'));
    const recorded = recordEvents([input], () => undefined);
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'NumpadEnter', ctrlKey: true }));
    const keys = new Array<string>();
    input.addEventListener('keydown', event => _isKey(event, 'enter', KEY_MODIFIERS.control) && _isKey(event, 'numpadenter', KEY_MODIFIERS.control, true) && keys.push(event.key));

    replayEvents(recorded);

    expect(keys).toEqual(['Enter']);
  });
});

describe('deferElementHydration', () => {
  it('starts nothing for an element declaring no trigger', () => {
    const start = vi.fn();

    expect(deferElementHydration(document.createElement('x-a'), start)).toBe(false);
    vi.runAllTimers();
    expect(start).not.toHaveBeenCalled();
  });

  it('records the events on the element and on its shadow root until its trigger fires, then starts it, removing the trigger, once', () => {
    const element = document.body.appendChild(document.createElement('x-a'));
    element.setAttribute('data-xd-hydrate', 'load');
    const inner = element.attachShadow({ mode: 'open' }).appendChild(document.createElement('button'));
    const start = vi.fn();

    expect(waitedForTrigger(element)).toBe(false);
    expect(deferElementHydration(element, start)).toBe(true);
    expect(deferElementHydration(element, start)).toBe(true);
    inner.dispatchEvent(new Event('click'));
    vi.runAllTimers();

    expect(start).toHaveBeenCalledOnce();
    expect(element.hasAttribute('data-xd-hydrate')).toBe(false);
    expect(waitedForTrigger(element)).toBe(true);
    const replayed = vi.fn();
    inner.addEventListener('click', replayed);
    replayElementEvents(element);
    expect(replayed).toHaveBeenCalledOnce();
    expect(waitedForTrigger(element)).toBe(false);
    replayElementEvents(element);
    expect(replayed).toHaveBeenCalledOnce();
  });

  it('starts an element waiting for an interaction at the first event on it, recorded to be replayed', () => {
    const element = document.body.appendChild(document.createElement('x-a'));
    element.setAttribute('data-xd-hydrate', 'interaction');
    const start = vi.fn();

    deferElementHydration(element, start);
    vi.runAllTimers();
    expect(start).not.toHaveBeenCalled();
    element.click();
    element.click();

    expect(start).toHaveBeenCalledOnce();
    const replayed = vi.fn();
    element.addEventListener('click', replayed);
    replayElementEvents(element);
    expect(replayed).toHaveBeenCalledTimes(2);
  });

  it('starts an element waiting for hover when the focus enters it, recording the event before it is stopped, to be replayed', () => {
    const element = document.body.appendChild(document.createElement('x-a'));
    element.setAttribute('data-xd-hydrate', 'hover');
    const inner = element.attachShadow({ mode: 'open' }).appendChild(document.createElement('input'));
    const start = vi.fn();

    deferElementHydration(element, start);
    inner.dispatchEvent(new Event('focusin', { bubbles: true, composed: true }));

    expect(start).toHaveBeenCalledOnce();
    const replayed = vi.fn();
    inner.addEventListener('focusin', replayed);
    replayElementEvents(element);
    expect(replayed).toHaveBeenCalledOnce();
  });

  it('keeps an element declaring never waiting for good, without recording its events', () => {
    const element = document.body.appendChild(document.createElement('x-a'));
    element.setAttribute('data-xd-hydrate', 'never');
    const start = vi.fn();
    const clicks = vi.fn();
    element.addEventListener('click', clicks);

    expect(deferElementHydration(element, start)).toBe(true);
    vi.runAllTimers();
    element.click();

    expect(start).not.toHaveBeenCalled();
    expect(clicks).toHaveBeenCalledOnce();
    expect(waitedForTrigger(element)).toBe(false);
    expect(element.getAttribute('data-xd-hydrate')).toBe('never');
  });

  describe('the events of the contract', () => {
    /**
     * Leaves on the page the contract of a click on an element, as the script of the page does.
     */
    const recordClick = (element: Element) => {
      const stop = vi.fn();
      const path = [element, element.parentNode!, document, window];
      window[_EVENT_CONTRACT_KEY] ??= { events: [], stops: [stop] };
      window[_EVENT_CONTRACT_KEY].events.push({ event: new MouseEvent('click', { bubbles: true, composed: true }), target: element, path });
      return stop;
    };

    it('fires interaction for an event of the contract, once the element is done connecting, replaying it', async () => {
      vi.useRealTimers();
      const element = document.body.appendChild(document.createElement('x-a'));
      element.setAttribute('data-xd-hydrate', 'interaction');
      const stop = recordClick(element);
      const start = vi.fn();

      deferElementHydration(element, start);

      expect(stop).toHaveBeenCalledOnce();
      expect(start).not.toHaveBeenCalled();
      await Promise.resolve();
      expect(start).toHaveBeenCalledOnce();

      const replayed = vi.fn();
      element.addEventListener('click', replayed);
      replayElementEvents(element);
      expect(replayed).toHaveBeenCalledOnce();
      vi.useFakeTimers();
    });

    it('waits for the other triggers keeping the events of the contract, replayed with the ones that follow', () => {
      const element = document.body.appendChild(document.createElement('x-a'));
      element.setAttribute('data-xd-hydrate', 'idle');
      recordClick(element);
      const start = vi.fn();

      deferElementHydration(element, start);
      element.click();
      vi.runAllTimers();

      expect(start).toHaveBeenCalledOnce();
      const replayed = vi.fn();
      element.addEventListener('click', replayed);
      replayElementEvents(element);
      expect(replayed).toHaveBeenCalledTimes(2);
    });

    it('replays the events of the contract at the end of a hydration, in their order, dropping the ones on a node that no longer exists', async () => {
      vi.useRealTimers();
      const first = document.body.appendChild(document.createElement('x-a'));
      const second = document.body.appendChild(document.createElement('x-b'));
      const removed = document.body.appendChild(document.createElement('x-c'));
      const stop = recordClick(first);
      recordClick(removed);
      recordClick(second);
      removed.remove();
      const order = new Array<string>();
      document.body.addEventListener('click', event => order.push((event.target as Element).localName), { once: false });

      replayContractEvents();
      replayContractEvents();
      expect(stop).toHaveBeenCalledOnce();
      expect(order).toEqual([]);
      await Promise.resolve();

      expect(order).toEqual(['x-a', 'x-b']);
      vi.useFakeTimers();
    });

    it('keeps the events going through an element still waiting to hydrate until it has', async () => {
      vi.useRealTimers();
      const element = document.body.appendChild(document.createElement('x-a'));
      let waits = true;
      Object.assign(element, { [WAITS_FOR_HYDRATION]: () => waits });
      recordClick(element);
      const replayed = vi.fn();
      element.addEventListener('click', replayed);

      replayContractEvents();
      await Promise.resolve();
      expect(replayed).not.toHaveBeenCalled();

      waits = false;
      replayContractEvents();
      await Promise.resolve();
      expect(replayed).toHaveBeenCalledOnce();
      vi.useFakeTimers();
    });

    it('leaves the other events of the contract to the replay when an element takes its own', async () => {
      vi.useRealTimers();
      const element = document.body.appendChild(document.createElement('x-a'));
      const other = document.body.appendChild(document.createElement('x-b'));
      element.setAttribute('data-xd-hydrate', 'idle');
      recordClick(element);
      recordClick(other);
      const replayed = vi.fn();
      other.addEventListener('click', replayed);

      deferElementHydration(element, () => undefined);
      replayContractEvents();
      await Promise.resolve();

      expect(replayed).toHaveBeenCalledOnce();
      vi.useFakeTimers();
    });

    it('does nothing in a page without the contract', () => {
      expect(() => replayContractEvents()).not.toThrow();
    });
  });

  it('replays nothing for an element that waited for no trigger', () => {
    expect(() => replayElementEvents(document.createElement('x-a'))).not.toThrow();
  });
});
