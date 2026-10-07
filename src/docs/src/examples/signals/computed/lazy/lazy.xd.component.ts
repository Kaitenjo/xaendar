import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A computed signal is lazy and cached: it runs only when read, and only if a dependency changed.
 */
@WebComponent({
  selector: 'ex-computed-lazy',
  templateUrl: './lazy.xd.component.html',
  styleUrl: './lazy.css'
})
export class ComputedLazyComponent extends CustomElement {
  /**
   * The first name.
   */
  public readonly first = signal('Ada');

  /**
   * The last name.
   */
  public readonly last = signal('Lovelace');

  /**
   * Whether the full name is displayed.
   */
  public readonly visible = signal(true);

  /**
   * How many times `fullName` was evaluated. A plain field: it is shown when something else re-renders.
   */
  public evaluations = 0;

  /**
   * Derived from `first` and `last`.
   */
  public readonly fullName = computed(() => {
    this.evaluations++;
    return `${this.first()} ${this.last()}`;
  });

  /**
   * The evaluations, refreshed on demand.
   */
  public readonly shownEvaluations = signal(0);

  /**
   * Shows the evaluation made by the first render.
   */
  public afterRender(): void {
    this.refresh();
  }

  /**
   * Reads `fullName` three times in a row: it is evaluated at most once.
   */
  public readThrice(): void {
    this.fullName();
    this.fullName();
    this.fullName();
    this.refresh();
  }

  /**
   * Changes the last name.
   */
  public rename(): void {
    this.last.update(last => last === 'Lovelace' ? 'Byron' : 'Lovelace');
    this.refresh();
  }

  /**
   * Shows or hides the full name.
   */
  public toggle(): void {
    this.visible.update(visible => !visible);
    this.refresh();
  }

  /**
   * Shows the current number of evaluations, once the template has updated.
   */
  public refresh(): void {
    queueMicrotask(() => this.shownEvaluations.set(this.evaluations));
  }
}
