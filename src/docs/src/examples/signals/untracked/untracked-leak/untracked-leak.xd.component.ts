import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';

/**
 * Known issue: inside untracked(), the reads that follow the evaluation of a computed signal are tracked again.
 */
@WebComponent({
  selector: 'ex-untracked-leak',
  templateUrl: './untracked-leak.xd.component.html',
  styleUrl: './untracked-leak.css'
})
export class UntrackedLeakComponent extends CustomElement {
  /**
   * Source of a computed signal.
   */
  public readonly price = signal(10);
  /**
   * A computed signal, read inside the untracked block.
   */
  public readonly total = computed(() => this._computeTotal());
  /**
   * Read after `total`, inside the untracked block: it should not be a dependency.
   */
  public readonly note = signal(0);
  /**
   * Read alone inside the untracked block of the second effect.
   */
  public readonly other = signal(0);
  /**
   * Runs of the effect reading `total` then `note` untracked.
   */
  public readonly leakingRuns = signal(0);
  /**
   * Runs of the effect reading only `other` untracked.
   */
  public readonly cleanRuns = signal(0);

  /**
   * Creates the two effects.
   */
  public onInit(): void {
    this.effect(() => {
      untracked(() => {
        this.total();
        this.note();
      });
      this.leakingRuns.update(runs => runs + 1);
    });
    this.effect(() => {
      untracked(() => this.other());
      this.cleanRuns.update(runs => runs + 1);
    });
  }

  /**
   * Changes `note`: the first effect runs again, although it read it untracked.
   */
  public changeNote(): void {
    this.note.update(note => note + 1);
  }

  /**
   * Changes `other`: the second effect does not run, as expected.
   */
  public changeOther(): void {
    this.other.update(other => other + 1);
  }

  /**
   * Computes the value of `total`.
   *
   * @returns Twice the price.
   */
  private _computeTotal(): number {
    return this.price() * 2;
  }
}
