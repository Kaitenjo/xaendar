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
  public readonly status = computed(() => this.progress() === 100 ? 'done' : this.progress() >= 50 ? 'half' : 'low');

  /**
   * The classes of the bar.
   */
  public readonly barClass = computed(() => 'bar bar--' + this.status());

  /**
   * The inline style of the bar.
   */
  public readonly barStyle = computed(() => 'width: ' + this.progress() + '%');

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setProgress(event: Event): void {
    this.progress.set(Number((event.target as HTMLInputElement).value));
  }
}
