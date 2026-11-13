import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Passes to a list the template rendering its options, as content, and the one rendering an empty list, as an input:
 * both read the members of this component.
 */
@WebComponent({
  selector: 'ex-content-template',
  styleUrl: './content-template.css',
  templateUrl: './content-template.xd.component.html'
})
export class ContentTemplateComponent extends CustomElement {
  /**
   * The fruits listed.
   */
  public readonly fruits = signal(['Apple', 'Cherry', 'Mango']);
  /**
   * The symbol marking the option selected, read by the template of the options.
   */
  public readonly marker = signal('✔');

  /**
   * Changes the symbol marking the option selected: the instances of the template read it where they are rendered.
   */
  public toggleMarker(): void {
    this.marker.update(marker => marker === '✔' ? '★' : '✔');
  }

  /**
   * Empties the list, or fills it again.
   */
  public toggleFruits(): void {
    this.fruits.update(fruits => fruits.length ? [] : ['Apple', 'Cherry', 'Mango']);
  }
}
