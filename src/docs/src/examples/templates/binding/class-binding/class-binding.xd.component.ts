import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A card whose tone comes from its bound `class` attribute, and two more classes from class bindings.
 */
@WebComponent({
  selector: 'ex-class-binding',
  styleUrl: './class-binding.css',
  templateUrl: './class-binding.xd.component.html'
})
export class ClassBindingComponent extends CustomElement {
  /**
   * Whether the card is highlighted.
   */
  public readonly highlighted = signal(false);
  /**
   * Whether the card is compact.
   */
  public readonly compact = signal(false);
  /**
   * The tone of the card, which names its class.
   */
  public readonly tone = signal<'info' | 'warning'>('info');

  /**
   * Highlights the card, or stops highlighting it.
   */
  public toggleHighlighted(): void {
    this.highlighted.update(highlighted => !highlighted);
  }

  /**
   * Makes the card compact, or not.
   */
  public toggleCompact(): void {
    this.compact.update(compact => !compact);
  }

  /**
   * Switches the tone of the card.
   */
  public switchTone(): void {
    this.tone.update(tone => tone === 'info' ? 'warning' : 'info');
  }
}
