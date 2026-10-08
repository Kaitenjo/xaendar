import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The same switch written twice: with @default last and with @default first.
 */
@WebComponent({
  selector: 'ex-default-first',
  templateUrl: './default-first.xd.component.html',
  styleUrl: './default-first.css'
})
export class DefaultFirstComponent extends CustomElement {
  /**
   * The size.
   */
  public readonly size = signal('small');

  /**
   * Switches between two sizes.
   */
  public toggle(): void {
    this.size.update(size => size === 'small' ? 'large' : 'small');
  }
}
