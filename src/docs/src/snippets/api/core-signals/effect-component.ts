import { CustomElement } from '@xaendar/core';
import { effect, signal } from '@xaendar/core/signals';

/**
 * The text being written, shared by the whole application.
 */
const draft = signal('');

// A standalone effect at module level: it runs as long as the page, or until its disposer is called
effect(() => localStorage.setItem('draft', draft()));

/**
 * A counter of the characters of the draft.
 */
export class DraftCounterComponent extends CustomElement {
  /**
   * Logs the length of the draft while the component is on the page.
   */
  public onInit(): void {
    // ✓ Disposed when the component leaves the page
    this.effect(() => console.log(draft().length));

    // ✗ Keeps running after the component leaves the page, and a new one starts at every connection
    effect(() => console.log(draft().length));
  }
}
