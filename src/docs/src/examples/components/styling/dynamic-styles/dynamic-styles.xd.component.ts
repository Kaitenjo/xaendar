import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A progress bar whose classes and inline style are bound to computed strings.
 */
@WebComponent({
  selector: 'ex-dynamic-styles',
  templateUrl: './dynamic-styles.xd.component.html',
  styleUrl: './dynamic-styles.css'
})
export class DynamicStylesComponent extends CustomElement {
  /**
   * The progress, from 0 to 100.
   */
  public readonly progress = signal(40);
  /**
   * The state of the progress.
   */
  public readonly status = computed(() => this._computeStatus());
  /**
   * The classes of the bar.
   */
  public readonly barClass = computed(() => this._computeBarClass());
  /**
   * The inline style of the bar.
   */
  public readonly barStyle = computed(() => this._computeBarStyle());

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setProgress(event: Event): void {
    this.progress.set(Number((event.target as HTMLInputElement).value));
  }

  /**
   * Computes the value of `status`.
   *
   * @returns The state of the progress.
   */
  private _computeStatus(): string {
    return this.progress() === 100 ? 'done' : this.progress() >= 50 ? 'half' : 'low';
  }

  /**
   * Computes the value of `barClass`.
   *
   * @returns The classes of the bar.
   */
  private _computeBarClass(): string {
    return `bar bar--${this.status()}`;
  }

  /**
   * Computes the value of `barStyle`.
   *
   * @returns The inline style of the bar.
   */
  private _computeBarStyle(): string {
    return `width: ${this.progress()}%`;
  }
}
