import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Two fields reacting to Enter: one with a modifier that does not exist, one filtering in its method.
 */
@WebComponent({
  selector: 'ex-key-filter',
  templateUrl: './key-filter.xd.component.html',
  styleUrl: './key-filter.css'
})
export class KeyFilterComponent extends CustomElement {
  /**
   * How many times each field saw Enter.
   */
  public readonly withModifier = signal(0);
  /**
   * How many times the second field saw Enter.
   */
  public readonly withFilter = signal(0);

  /**
   * Called by the first field: never, since no event is named keydown.enter.
   */
  public onEnter(): void {
    this.withModifier.update(count => count + 1);
  }

  /**
   * Called by the second field for every key: it filters Enter itself.
   *
   * @param event - The keydown event.
   */
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.withFilter.update(count => count + 1);
    }
  }
}
