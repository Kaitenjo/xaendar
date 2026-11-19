import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A progress bar whose width, colour and weight come from style bindings: a unit, a custom property and a property
 * removed by null.
 */
@WebComponent({
  selector: 'ex-style-binding',
  styleUrl: './style-binding.css',
  templateUrl: './style-binding.xd.component.html'
})
export class StyleBindingComponent extends CustomElement {
  /**
   * The progress, in percent.
   */
  public readonly progress = signal(30);
  /**
   * Whether the bar is highlighted.
   */
  public readonly highlighted = signal(false);

  /**
   * Moves the progress forward, back to the start after the end.
   */
  public advance(): void {
    this.progress.update(progress => progress >= 100 ? 0 : progress + 10);
  }

  /**
   * Highlights the bar, or stops highlighting it.
   */
  public toggleHighlighted(): void {
    this.highlighted.update(highlighted => !highlighted);
  }
}
