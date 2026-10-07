import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Styles the inside of a panel from outside, through the part it exposes, and the content it projects.
 */
@WebComponent({
  selector: 'ex-parts-and-slotted',
  templateUrl: './parts-and-slotted.xd.component.html',
  styleUrl: './parts-and-slotted.css'
})
export class PartsAndSlottedComponent extends CustomElement {
  /**
   * Whether the panel is highlighted.
   */
  public readonly highlighted = signal(false);

  /**
   * Toggles the highlight.
   */
  public toggle(): void {
    this.highlighted.update(highlighted => !highlighted);
  }
}
