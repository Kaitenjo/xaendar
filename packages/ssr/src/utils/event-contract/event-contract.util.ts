import { escapeAttribute } from '@xaendar/common';
import { _EVENT_CONTRACT_KEY, _RECORDED_EVENTS, _SUBMIT_ATTRIBUTE, type _EventContract } from '@xaendar/core';

/**
 * The most events the contract keeps. A page made only of static components never loads the runtime that empties the
 * queue, which would otherwise grow as long as the page stays open: the events kept are the first ones, as the replay
 * needs them in order.
 */
const EVENTS_LIMIT = 256;

/**
 * The script of the page recording what the user does before the runtime is there. It is written into the HTML as the
 * text of this function, so it reads nothing outside of it: what it needs comes from its parameters, and it needs no
 * runtime, which it runs before.
 *
 * - The listeners are in the capture phase, on the document and on every shadow root under the root of the page. The
 *   document alone would not do: `change` and `submit` are not `composed`, so inside a shadow root they stop there and
 *   never reach it. A `composed` event, seen by both, is recorded once.
 * - It records the events whatever their target, leaving them untouched: it cannot know what has a listener, and it does
 *   not need to. Replaying an event on a node without listeners does nothing, and only the runtime, once it is there, can
 *   do something about `interaction`, so the triggers leave no trace in the HTML.
 * - `submit` is the one decision that cannot wait for the runtime: the browser would leave the page. It is prevented only
 *   when a node of its path listens to it in a template, marked by the attribute `_SUBMIT_ATTRIBUTE`, so that a plain form
 *   of a static part of the page keeps working.
 * - More than one root of the page in a document share the contract, the first one creating it.
 *
 * @param root - The element of the root of the page, whose shadow roots the parser has already attached.
 * @param key - The name of the property of `window` holding the contract.
 * @param names - The events to record.
 * @param submitAttribute - The attribute marking what listens to `submit`.
 * @param limit - The most events to keep.
 */
export function eventContract(root: Element, key: string, names: readonly string[], submitAttribute: string, limit: number): void {
  const page = window as unknown as Record<string, _EventContract | undefined>;
  const contract = page[key] ??= { events: [], stops: [] };
  const record = (event: Event) => {
    const { events } = contract;
    const path = event.composedPath();
    if (events.at(-1)?.event !== event && events.length < limit) {
      events.push({ event, target: path[0], path });
    }

    if (event.type === 'submit' && path.some(node => (node as Element).hasAttribute?.(submitAttribute))) {
      event.preventDefault();
    }
  };

  const listen = (target: EventTarget) => {
    for (let i = 0; i < names.length; i++) {
      target.addEventListener(names[i], record, true);
      contract.stops.push(() => target.removeEventListener(names[i], record, true));
    }
  };

  const visit = (element: Element) => {
    const { shadowRoot } = element;
    if (shadowRoot) {
      listen(shadowRoot);
      visitAll(shadowRoot);
    }

    visitAll(element);
  };

  const visitAll = (parent: ParentNode) => {
    const { children } = parent;
    for (let i = 0; i < children.length; i++) {
      visit(children[i]);
    }
  };

  listen(document);
  visit(root);
}

/**
 * Writes the event contract into the HTML of a page, as a script running where the parser reaches it: right after the
 * root of the page, which it finds as the element before it, so that the shadow roots of the root are there, and before
 * the bundles, which are modules, run. A strict `Content-Security-Policy` blocks it as any inline script, unless the
 * script holds the nonce of the response: without it, the page works, losing the events before the hydration.
 *
 * It records the events the content waiting for a trigger needs, whether it has listeners or not, along with the ones the
 * templates of the page listen to.
 *
 * @param names - The events the components of the page listen to.
 * @param nonce - The nonce of the `Content-Security-Policy` of the response, if any.
 * @returns The script.
 */
export function _writeEventContract(names: ReadonlySet<string>, nonce?: string): string {
  const events = new Set(_RECORDED_EVENTS);
  for (const name of names) {
    events.add(name);
  }

  const args = JSON.stringify([_EVENT_CONTRACT_KEY, Array.from(events), _SUBMIT_ATTRIBUTE, EVENTS_LIMIT]).slice(1, -1).replaceAll('<', '\\u003c');
  const nonceAttribute = nonce ? ` nonce="${escapeAttribute(nonce)}"` : '';
  return `<script${nonceAttribute}>(${eventContract.toString()})(document.currentScript.previousElementSibling,${args})</script>`;
}
