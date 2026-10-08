import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A menu closed by a click anywhere outside of it.
 */
@WebComponent({
  selector: 'ex-dropdown-menu',
  templateUrl: './dropdown-menu.xd.component.html',
  styleUrl: './dropdown-menu.css'
})
export class DropdownMenuComponent extends CustomElement {
  /**
   * Whether the menu is open.
   */
  public readonly open = signal(false);

  /**
   * The last item picked.
   */
  public readonly picked = signal('nothing');

  /**
   * Opens or closes the menu.
   */
  public toggle(): void {
    this.open.update(open => !open);
  }

  /**
   * Closes the menu.
   */
  public close(): void {
    this.open.set(false);
  }

  /**
   * Picks an item and closes the menu.
   *
   * @param item - The item picked.
   */
  public pick(item: string): void {
    this.picked.set(item);
    this.close();
  }
}
