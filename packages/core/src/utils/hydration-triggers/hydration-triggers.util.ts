import type { NoArgsVoidFunction } from '@xaendar/types';
import { _EVENT_CONTRACT_KEY, _HYDRATE_ATTRIBUTE, _RECORDED_EVENTS, WAITS_FOR_HYDRATION } from '../../costants';
import type { _ContractEvent } from '../../types/event-contract.type';
import type { HydrateTrigger } from '../../types/hydrate-trigger.type';
import type { RecordedEvents } from '../../types/recorded-events.type';
import type { Trigger } from '../../types/triggers/trigger.type';
import type { _Context } from '../context/context.util';

/**
 * The events firing the `hover` trigger: the pointer moving over an element, and the focus entering it, for the users
 * of the keyboard.
 */
const HOVER_EVENTS: readonly string[] = ['mouseover', 'focusin'];

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
 * Arms the triggers of content waiting to be rendered or hydrated: `fire` runs once, when the first of them fires.
 * `load` fires once the code rendering the page is done, `idle` when the browser is idle (after a timeout where
 * `requestIdleCallback` is missing), at the latest once the time it declares has passed, `timer` once its time has
 * passed, `visible` when one of the elements enters the viewport, observed with the options it declares, `interaction`
 * at the first event on one of them, once the listeners of the element and of the ones it holds have handled it, `hover`
 * when the pointer moves over one of them or the focus enters it, before any listener. A trigger naming the element it
 * watches watches that one in place of the elements. The element a trigger names, and the options of `visible` when
 * an expression computes them, are read now, calling the functions of the module of the template with the component and
 * the context of the scope holding the block.
 *
 * @param triggers - The triggers.
 * @param elements - The elements `visible`, `interaction` and `hover` watch, unless they name the element to watch.
 * @param fire - Runs when a trigger fires.
 * @param context - The context of the scope holding the block, which the triggers naming an element read: given by a
 *   `@defer` or a `@hydrate`, whose triggers are written in the template.
 * @returns Disarms the triggers.
 */
export function armTriggers(triggers: readonly Trigger[], elements: readonly Element[], fire: NoArgsVoidFunction, context?: _Context): NoArgsVoidFunction {
  const disarms = new Array<NoArgsVoidFunction>();
  const disarm = () => disarmAll(disarms);
  const once = () => {
    disarm();
    fire();
  };

  for (let i = 0; i < triggers.length; i++) {
    disarms.push(armTrigger(triggers[i], elements, once, context));
  }

  return disarm;
}

/**
 * Runs the functions disarming some triggers, and forgets them.
 *
 * @param disarms - The functions, emptied.
 */
export function disarmAll(disarms: NoArgsVoidFunction[]): void {
  for (let i = 0; i < disarms.length; i++) {
    disarms[i]();
  }
  disarms.length = 0;
}

/**
 * Turns the triggers watching the elements of their block into `idle` when there are none to watch (see {@link toIdle}).
 *
 * @param triggers - The triggers.
 * @param elements - The elements of the block.
 * @returns The triggers to arm.
 */
export function watchedTriggers(triggers: readonly Trigger[], elements: readonly Element[]): readonly Trigger[] {
  return elements.length ? triggers : triggers.map(toIdle);
}

/**
 * Returns the trigger to wait for in place of one watching the elements of its block, `visible`, `interaction` or
 * `hover` without an element it names, where there are none to watch: `idle`.
 *
 * @param trigger - The trigger.
 * @returns The trigger to wait for.
 */
export function toIdle(trigger: Trigger): Trigger {
  if (typeof trigger !== 'string') {
    return trigger.kind === 'idle' || trigger.kind === 'timer' || trigger.target ? trigger : 'idle';
  }

  switch (trigger) {
    case 'visible':
    case 'interaction':
    case 'hover':
      return 'idle';

    default:
      return trigger;
  }
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

  // The events are recorded on the shadow root too, where the ones that are not composed stop
  const targets = element.shadowRoot ? [element, element.shadowRoot] : [element];
  const interaction = trigger === 'interaction';
  // Armed before the events are recorded, so that `hover` sees the focus entering the element before it is stopped
  const disarm: NoArgsVoidFunction | undefined = interaction ? undefined : armTriggers([trigger], [element], () => hydrateElement(element, start, disarm));
  const recorded = recordEvents(targets, () => interaction && hydrateElement(element, start, disarm));
  elementEvents.set(element, recorded);
  // Fired once the element has done connecting: what the contract recorded was an interaction too
  if (interaction && recorded.events.length) {
    queueMicrotask(() => hydrateElement(element, start, disarm));
  }

  return true;
}

/**
 * Starts the hydration of the element of a component waiting for its trigger, the first time the trigger fires: the
 * element no longer declares it then.
 *
 * @param element - The element.
 * @param start - Starts the hydration of the element.
 * @param disarm - Disarms the trigger, `undefined` for `interaction`, fired by the events recorded.
 */
function hydrateElement(element: Element, start: NoArgsVoidFunction, disarm: NoArgsVoidFunction | undefined): void {
  if (element.hasAttribute(_HYDRATE_ATTRIBUTE)) {
    disarm?.();
    element.removeAttribute(_HYDRATE_ATTRIBUTE);
    start();
  }
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
    events[i].path.some(waitsForHydration)
      ? waiting.push(events[i])
      : replayEvent(events[i]);
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
  const contract = window[_EVENT_CONTRACT_KEY];
  if (contract) {
    delete window[_EVENT_CONTRACT_KEY];
    for (let i = 0; i < contract.stops.length; i++) {
      contract.stops[i]();
    }

    contractEvents = contract.events;
  }

  if (!targets || !contractEvents?.length) {
    return contractEvents;
  }

  const taken = contractEvents.filter(event => isOnTargets(event, targets));
  contractEvents = contractEvents.filter(event => !isOnTargets(event, targets));
  return taken;
}

/**
 * Tells whether an event of the contract happened on some nodes.
 *
 * @param event - The event.
 * @param targets - The nodes.
 * @returns `true` when one of the nodes is on the path of the event.
 */
function isOnTargets({ path }: _ContractEvent, targets: readonly EventTarget[]): boolean {
  return targets.some(target => path.includes(target));
}

/**
 * Arms a trigger (see {@link armTriggers}).
 *
 * @param trigger - The trigger.
 * @param elements - The elements a trigger watching elements watches, unless it names the element to watch.
 * @param fire - Runs when the trigger fires.
 * @param context - The context of the scope holding the block, which the element a trigger names, and the options of
 *   `visible` when an expression computes them, read.
 * @param options - The options of the observer of `visible`, if it declares them.
 * @returns Disarms the trigger.
 */
function armTrigger(trigger: Trigger, elements: readonly Element[], fire: NoArgsVoidFunction, context: _Context | undefined, options?: IntersectionObserverInit): NoArgsVoidFunction {
  if (typeof trigger !== 'string') {
    switch (trigger.kind) {
      case 'idle':
        return whenIdle(fire, trigger.timeout);

      case 'timer':
        return whenTimer(fire, trigger.delay);

      default: {
        const { target, options: declared } = trigger;
        const component = context?.component;
        return armTrigger(trigger.kind, target ? [target.call(component, context!)] : elements, fire, context, typeof declared === 'function' ? declared.call(component, context!) : declared);
      }
    }
  }

  switch (trigger) {
    case 'idle':
      return whenIdle(fire);

    case 'visible':
      return whenVisible(elements, fire, options);

    // In the bubbling phase, so that the listeners of the elements handle the event first
    case 'interaction':
      return listen(elements, fire, false);

    // In the capture phase, before the recording of the events of content waiting for its hydration stops them
    case 'hover':
      return listen(elements, fire, true, HOVER_EVENTS);

    default:
      return whenLoaded(fire);
  }
}

/**
 * Runs a function once the code running now is done.
 *
 * @param fire - The function.
 * @returns Cancels it.
 */
function whenLoaded(fire: NoArgsVoidFunction): NoArgsVoidFunction {
  return whenTimer(fire, 0);
}

/**
 * Runs a function once a time has passed.
 *
 * @param fire - The function.
 * @param delay - The time, in milliseconds.
 * @returns Cancels it.
 */
function whenTimer(fire: NoArgsVoidFunction, delay: number): NoArgsVoidFunction {
  const timeout = setTimeout(fire, delay);
  return () => clearTimeout(timeout);
}

/**
 * Runs a function when the browser is idle, at the latest once a time has passed, or once the code running now is done
 * where `requestIdleCallback` is missing.
 *
 * @param fire - The function.
 * @param timeout - The longest time to wait, in milliseconds, if any.
 * @returns Cancels it.
 */
function whenIdle(fire: NoArgsVoidFunction, timeout?: number): NoArgsVoidFunction {
  if (typeof requestIdleCallback !== 'function') {
    return whenLoaded(fire);
  }

  const handle = requestIdleCallback(fire, { timeout });
  return () => cancelIdleCallback(handle);
}

/**
 * Runs a function when one of the elements enters the viewport.
 *
 * @param elements - The elements.
 * @param fire - The function.
 * @param options - The options of the observer, if any.
 * @returns Stops observing the elements.
 */
function whenVisible(elements: readonly Element[], fire: NoArgsVoidFunction, options?: IntersectionObserverInit): NoArgsVoidFunction {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      fire();
    }
  }, options);
  for (let i = 0; i < elements.length; i++) {
    observer.observe(elements[i]);
  }

  return () => observer.disconnect();
}

/**
 * Listens to events on some nodes, by default the ones recorded on content waiting for its hydration: in the capture
 * phase, before any listener of the content, or in the bubbling phase, after them.
 *
 * @param targets - The nodes to listen on.
 * @param listener - The listener.
 * @param capture - Whether to listen in the capture phase.
 * @param events - The events to listen to.
 * @returns Removes the listeners.
 */
function listen(targets: readonly EventTarget[], listener: (event: Event) => void, capture = true, events = _RECORDED_EVENTS): NoArgsVoidFunction {
  for (let i = 0; i < targets.length; i++) {
    for (let j = 0; j < events.length; j++) {
      targets[i].addEventListener(events[j], listener, { capture });
    }
  }

  return () => {
    for (let i = 0; i < targets.length; i++) {
      for (let j = 0; j < events.length; j++) {
        targets[i].removeEventListener(events[j], listener, { capture });
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
