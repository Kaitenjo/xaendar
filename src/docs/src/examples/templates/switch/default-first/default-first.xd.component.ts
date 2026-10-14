import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The same switch written twice, with @default last and with @default first: both render the matching case.
 */
@WebComponent({
  selector: 'ex-default-first',
  styleUrl: './default-first.css',
  templateUrl: './default-first.xd.component.html'
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
