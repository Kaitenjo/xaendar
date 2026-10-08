import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A custom directive painting an element, and a structural directive deciding whether another one exists.
 */
@WebComponent({
  selector: 'ex-directive-basics',
  templateUrl: './directive-basics.xd.component.html',
  styleUrl: './directive-basics.css'
})
export class DirectiveBasicsComponent extends CustomElement {
  /**
   * The color painted by the custom directive.
   */
  public readonly color = signal('#fde68a');

  /**
   * Whether the structural directive renders its element.
   */
  public readonly shown = signal(true);

  /**
   * Picks a color.
   *
   * @param event - The change event of the select.
   */
  public pick(event: Event): void {
    this.color.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Shows or hides the second paragraph.
   */
  public toggle(): void {
    this.shown.update(shown => !shown);
  }
}
