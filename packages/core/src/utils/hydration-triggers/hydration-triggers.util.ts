import type { NoArgsVoidFunction } from '@xaendar/types';
import { _EVENT_CONTRACT_KEY, _HYDRATE_ATTRIBUTE, _RECORDED_EVENTS, WAITS_FOR_HYDRATION } from '../../costants';
import type { _ContractEvent, _EventContract } from '../../types/event-contract.type';
import type { HydrateTrigger } from '../../types/hydrate-trigger.type';
import type { RecordedEvents } from '../../types/recorded-events.type';

/**
 * The events recorded on the elements of components waiting for the trigger their `@WebComponent` declares, replayed
 * once they are hydrated (see {@link deferElementHydration}).
 */
const elementEvents = new WeakMap<Element, RecordedEvents>();

/**
 * The events the contract recorded before the runtime was there, in the order they happened, that nothing replayed yet.
 */
let contractEvents: _ContractEvent[] | undefined;

/**
 * Whether the replay of the events of the contract is scheduled (see {@link replayContractEvents}).
 */
let replayScheduled = false;

/**
 * Arms the triggers written by name of content waiting to be hydrated: `fire` runs once, when the first of them fires.
 * `load` fires once the code rendering the page is done, `idle` when the browser is idle (after a timeout where
 * `requestIdleCallback` is missing), `visible` when one of the elements enters the viewport, `interaction` at the first
 * event on one of them.
 *
 * @param triggers - The triggers.
 * @param elements - The elements `visible` and `interaction` watch.
 * @param fire - Runs when a trigger fires.
 * @returns Disarms the triggers.
 */
export function armTriggers(triggers: readonly HydrateTrigger[], elements: readonly Element[], fire: NoArgsVoidFunction): NoArgsVoidFunction {
  const disarms = new Array<NoArgsVoidFunction>();
  const disarm = () => {
    for (let i = 0; i < disarms.length; i++) {
      disarms[i]();
    }
    disarms.length = 0;
  };
  const once = () => {
    disarm();
    fire();
  };

  for (let i = 0; i < triggers.length; i++) {
    switch (triggers[i]) {
      case 'idle':
        disarms.push(whenIdle(once));
        break;

      case 'visible':
        disarms.push(whenVisible(elements, once));
        break;

      case 'interaction':
        disarms.push(listen(elements, once));
        break;

      default:
        disarms.push(whenLoaded(once));
    }
  }

  return disarm;
}

/**
 * Records the events on content rendered on the server that waits for its hydration: each one is stopped, so that the
 * content, inert, handles none, and a `submit` is prevented, which would leave the page. Once the content is hydrated,
 * they are replayed on their targets (see {@link replayEvents}).
 *
 * The ones the event contract recorded on the targets before the runtime was there come first, in their order: nothing
 * can fire a trigger before the runtime is there, so the caller finds them in the events it gets, and fires `interaction`
 * for them. `onEvent` runs only for the events that follow.
 *
 * @param targets - The nodes holding the content: its elements, and the shadow root of a component.
 * @param onEvent - Runs at each event recorded.
 * @returns The events recorded, and the function stopping the recording.
 */
export function recordEvents(targets: readonly EventTarget[], onEvent: NoArgsVoidFunction): RecordedEvents {
  const events: RecordedEvents['events'] = [];
  const taken = takeContractEvents(targets);
  if (taken?.length) {
    for (let i = 0; i < taken.length; i++) {
      events.push(taken[i]);
    }
  }

  const stop = listen(targets, event => {
    event.stopImmediatePropagation();
    if (event.type === 'submit') {
      event.preventDefault();
    }

    events.push({ event, target: event.composedPath()[0] });
    onEvent();
  });

  return { events, stop };
}

/**
 * Stops recording events and replays the ones recorded, in order, on their targets still in the document: each one is
 * dispatched again as a new event of the same kind, its default action prevented, since the browser already performed
 * the one of the event recorded.
 *
 * @param recorded - The events recorded.
 */
export function replayEvents(recorded: RecordedEvents): void {
  recorded.stop();
  const { events } = recorded;
  for (let i = 0; i < events.length; i++) {
    replayEvent(events[i]);
  }

  events.length = 0;
}

/**
 * Replays, once the code hydrating the page in this tick is done, the events the contract recorded that nothing replayed
 * yet: at the end of a hydration, so that the listeners of the components holding a target are all bound. They are
 * dispatched in the order they happened; the ones on a node that no longer exists are dropped, and the ones going through
 * an element still waiting to hydrate stay until it does.
 *
 * Stops the contract: from now on the listeners of the components, and the recording of what waits for a trigger, see the
 * events. Does nothing in a page without the contract, such as one rendered in the browser.
 */
export function replayContractEvents(): void {
  if (!replayScheduled && takeContractEvents()?.length) {
    replayScheduled = true;
    queueMicrotask(replayReadyEvents);
  }
}

/**
 * Defers the hydration of the element of a component rendered on the server until the trigger its `@WebComponent`
 * declares fires, written by the server into the attribute `data-xd-hydrate`: the events on the element, and on its
 * shadow root, are recorded meanwhile. When the trigger fires, the attribute is removed and `start` runs; the events
 * are replayed once the component is hydrated (see {@link replayElementEvents}).
 *
 * An element connected again while it waits keeps waiting for the trigger armed the first time. An element declaring
 * `never` waits for good, with no event recorded: recording would stop them, and it stays plain HTML.
 *
 * @param element - The element.
 * @param start - Starts the hydration of the element.
 * @returns `true` when the element waits for its trigger, `false` when it declares none.
 */
export function deferElementHydration(element: Element, start: NoArgsVoidFunction): boolean {
  const trigger = element.getAttribute(_HYDRATE_ATTRIBUTE) as HydrateTrigger | null;
  if (!trigger || trigger === 'never' || elementEvents.has(element)) {
    return !!trigger;
  }

  let fired = false;
  const fire = () => {
    if (!fired) {
      fired = true;
      disarm();
      element.removeAttribute(_HYDRATE_ATTRIBUTE);
      start();
    }
  };

  // The events are recorded on the shadow root too, where the ones that are not composed stop
  const targets = element.shadowRoot ? [element, element.shadowRoot] : [element];
  const interaction = trigger === 'interaction';
  const recorded = recordEvents(targets, () => interaction && fire());
  elementEvents.set(element, recorded);
  const disarm = interaction ? () => undefined : armTriggers([trigger], [element], fire);
  // Fired once the element has done connecting: what the contract recorded was an interaction too
  if (interaction && recorded.events.length) {
    queueMicrotask(fire);
  }

  return true;
}

/**
 * Replays the events recorded on the element of a component while it waited for its trigger (see
 * {@link deferElementHydration}), once it is hydrated.
 *
 * @param element - The element.
 */
export function replayElementEvents(element: Element): void {
  const recorded = elementEvents.get(element);
  if (recorded) {
    elementEvents.delete(element);
    replayEvents(recorded);
  }
}

/**
 * Tells whether the element of a component waited for the trigger its `@WebComponent` declares, until it is hydrated
 * (see {@link deferElementHydration}).
 *
 * @param element - The element.
 * @returns `true` from when it starts waiting until its events are replayed.
 */
export function waitedForTrigger(element: Element): boolean {
  return elementEvents.has(element);
}

/**
 * Replays an event on its target, if it still exists, as a new event of the same kind, its default action prevented,
 * since the browser already performed the one of the event recorded.
 *
 * @param recorded - The event and its target.
 */
function replayEvent({ event, target }: RecordedEvents['events'][number]): void {
  if ((target as Node).isConnected) {
    const replayed = new (event.constructor as typeof Event)(event.type, event);
    target.addEventListener(event.type, preventDefault, { capture: true, once: true });
    target.dispatchEvent(replayed);
  }
}

/**
 * Replays the events of the contract whose path holds no element waiting to hydrate, keeping the others.
 */
function replayReadyEvents(): void {
  replayScheduled = false;
  const events = contractEvents!;
  const waiting = new Array<_ContractEvent>();
  for (let i = 0; i < events.length; i++) {
    if (events[i].path.some(waitsForHydration)) {
      waiting.push(events[i]);
    } else {
      replayEvent(events[i]);
    }
  }

  contractEvents = waiting;
}

/**
 * Tells whether a node of the path of an event is an element still waiting to hydrate.
 *
 * @param node - The node.
 * @returns `true` when it waits.
 */
function waitsForHydration(node: EventTarget): boolean {
  return !!(node as Partial<Record<typeof WAITS_FOR_HYDRATION, () => boolean>>)[WAITS_FOR_HYDRATION]?.();
}

/**
 * Stops the event contract, the first time the runtime needs it, and returns the events it recorded: a listener left on
 * the document would record again what the components now handle, replaying it twice.
 *
 * @param targets - The nodes to take the events of, removed from the ones left: all of them, without it.
 * @returns The events, `undefined` when there is none.
 */
function takeContractEvents(targets?: readonly EventTarget[]): _ContractEvent[] | undefined {
  const page = globalThis as unknown as Partial<Record<typeof _EVENT_CONTRACT_KEY, _EventContract>>;
  const contract = page[_EVENT_CONTRACT_KEY];
  if (contract) {
    delete page[_EVENT_CONTRACT_KEY];
    for (let i = 0; i < contract.stops.length; i++) {
      contract.stops[i]();
    }

    contractEvents = contract.events;
  }

  if (!targets || !contractEvents?.length) {
    return contractEvents;
  }

  const isOnTargets = ({ path }: _ContractEvent) => targets.some(target => path.includes(target));
  const taken = contractEvents.filter(isOnTargets);
  contractEvents = contractEvents.filter(event => !isOnTargets(event));
  return taken;
}

/**
 * Runs a function once the code running now is done.
 *
 * @param fire - The function.
 * @returns Cancels it.
 */
function whenLoaded(fire: NoArgsVoidFunction): NoArgsVoidFunction {
  const timeout = setTimeout(fire);
  return () => clearTimeout(timeout);
}

/**
 * Runs a function when the browser is idle, or once the code running now is done where `requestIdleCallback` is
 * missing.
 *
 * @param fire - The function.
 * @returns Cancels it.
 */
function whenIdle(fire: NoArgsVoidFunction): NoArgsVoidFunction {
  if (typeof requestIdleCallback !== 'function') {
    return whenLoaded(fire);
  }

  const handle = requestIdleCallback(fire);
  return () => cancelIdleCallback(handle);
}

/**
 * Runs a function when one of the elements enters the viewport.
 *
 * @param elements - The elements.
 * @param fire - The function.
 * @returns Stops observing the elements.
 */
function whenVisible(elements: readonly Element[], fire: NoArgsVoidFunction): NoArgsVoidFunction {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      fire();
    }
  });
  for (let i = 0; i < elements.length; i++) {
    observer.observe(elements[i]);
  }

  return () => observer.disconnect();
}

/**
 * Listens, in the capture phase, to the events recorded on content waiting for its hydration.
 *
 * @param targets - The nodes to listen on.
 * @param listener - The listener.
 * @returns Removes the listeners.
 */
function listen(targets: readonly EventTarget[], listener: (event: Event) => void): NoArgsVoidFunction {
  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < _RECORDED_EVENTS.length; j++) {
      targets[i].addEventListener(_RECORDED_EVENTS[j], listener, { capture: true });
    }
  }

  return () => {
    for (let i = 0; i < targets.length; i++) {
      for (let j = 0; j < _RECORDED_EVENTS.length; j++) {
        targets[i].removeEventListener(_RECORDED_EVENTS[j], listener, { capture: true });
      }
    }
  };
}

/**
 * Prevents the default action of an event.
 *
 * @param event - The event.
 */
function preventDefault(event: Event): void {
  event.preventDefault();
}
