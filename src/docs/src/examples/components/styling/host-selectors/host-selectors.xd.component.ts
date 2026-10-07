import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Selects a chip on click. The chips style themselves from their own stylesheet, reacting to the class and the
 * attributes the parent sets on them.
 */
@WebComponent({
  selector: 'ex-host-selectors',
  templateUrl: './host-selectors.xd.component.html',
  styleUrl: './host-selectors.css'
})
export class HostSelectorsComponent extends CustomElement {
  /**
   * The name of the selected chip.
   */
  public readonly selected = signal('signals');

  /**
   * Selects the clicked chip. One listener on the container serves every chip: a click inside a chip reaches it
   * with the chip as its target.
   *
   * @param event - The click.
   */
  public pick(event: MouseEvent): void {
    const chip = (event.target as HTMLElement).closest<HTMLElement>('ex-chip');
    if (chip) {
      this.selected.set(chip.dataset['name'] ?? '');
    }
  }
}
