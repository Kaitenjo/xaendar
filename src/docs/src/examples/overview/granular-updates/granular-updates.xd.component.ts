import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Logs every DOM mutation of its card, to show that a signal change only touches the nodes reading it.
 */
@WebComponent({
  selector: 'ex-granular-updates',
  templateUrl: './granular-updates.xd.component.html',
  styleUrl: './granular-updates.css'
})
export class GranularUpdatesComponent extends CustomElement {
  /**
   * How many times the button was clicked.
   */
  public readonly count = signal(0);
  /**
   * The name being greeted.
   */
  public readonly name = signal('Ada');
  /**
   * The DOM mutations observed so far, most recent first. Each entry has a unique id to be tracked by.
   */
  public readonly mutations = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The card whose mutations are observed.
   */
  @Query('.card')
  public accessor card!: QuerySignal<HTMLElement | null>;
  /**
   * The id of the next logged mutation.
   */
  private _nextId = 0;
  /**
   * Observes the card.
   */
  private _observer: MutationObserver | undefined;

  /**
   * Starts observing the card, once it is rendered.
   */
  public afterRender(): void {
    const card = this.card();
    if (!card) {
      return;
    }

    this._observer = new MutationObserver(records => {
      const entries = records.map(record => {
        const target = record.target;
        // Flashing uses the Web Animations API, which does not mutate the DOM
        const element = target instanceof Element ? target : target.parentElement;
        element?.animate([{ backgroundColor: 'rgba(255, 196, 0, 0.6)' }, { backgroundColor: 'transparent' }], 900);
        const text = record.type === 'attributes'
          ? `attribute "${record.attributeName}" of <${(target as Element).localName}> → "${(target as Element).getAttribute(record.attributeName!)}"`
          : `text node in <${target.parentElement?.localName}> → "${target.textContent}"`;
        return { id: this._nextId++, text };
      });
      this.mutations.update(list => [...entries, ...list].slice(0, 6));
    });
    this._observer.observe(card, { subtree: true, characterData: true, attributes: true, childList: true });
  }

  /**
   * Increments the counter.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }

  /**
   * Greets someone else.
   */
  public rename(): void {
    this.name.update(name => name === 'Ada' ? 'Grace' : 'Ada');
  }

  /**
   * Stops observing the card.
   */
  public onDestroy(): void {
    this._observer?.disconnect();
  }
}
