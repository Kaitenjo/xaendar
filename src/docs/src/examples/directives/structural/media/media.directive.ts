import { Directive, Property, StructuralDirective } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal, Signal } from '@xaendar/core/signals';

/**
 * One signal per media query, shared by every directive using it. A structural directive has no
 * onDestroy hook to remove a listener, so the listeners live here, one per query, for the whole application.
 */
const queries = new Map<string, Signal<boolean>>();

/**
 * Returns the signal tracking a media query, creating it on first use.
 *
 * @param query - The media query.
 * @returns A signal holding whether the query matches.
 */
function matches(query: string): Signal<boolean> {
  let matching = queries.get(query);
  if (!matching) {
    const list = window.matchMedia(query);
    const created = signal(list.matches);
    list.addEventListener('change', event => created.set(event.matches));
    queries.set(query, created);
    matching = created;
  }
  return matching;
}

/**
 * Renders the element while a media query matches.
 */
@Directive({ selector: 'exMedia' })
export class MediaDirective extends StructuralDirective {
  /**
   * The media query.
   */
  @Property('all')
  public accessor query!: InputSignal<string>;

  /**
   * @returns Whether the query matches: the signal is read, so a change of the viewport renders again.
   */
  public shouldRender(): boolean {
    return matches(this.query())();
  }
}
