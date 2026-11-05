// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _EVENT_CONTRACT_KEY, WAITS_FOR_HYDRATION } from '../../costants';
import { armTriggers, deferElementHydration, recordEvents, replayContractEvents, replayElementEvents, replayEvents, waitedForTrigger } from './hydration-triggers.util';

/**
 * The IntersectionObserver standing for the one of the browser: `intersect` calls the callback of the last one created.
 */
class FakeIntersectionObserver {
  public static last: FakeIntersectionObserver;
  public readonly observed = new Array<Element>();
  public disconnected = false;

  constructor(private readonly _callback: (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void) {
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
