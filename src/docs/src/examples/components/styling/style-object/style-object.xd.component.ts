import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Binds the same styles to `style` as an object and as a string.
 */
@WebComponent({
  selector: 'ex-style-object',
  templateUrl: './style-object.xd.component.html',
  styleUrl: './style-object.css'
})
export class StyleObjectComponent extends CustomElement {
  /**
   * The styles, as an object.
   */
  public readonly styles = signal({ color: '#d32f2f', 'font-weight': '700' });

  /**
   * The same styles, as a string.
   */
  public readonly css = computed(() => Object.entries(this.styles()).map(([name, value]) => name + ': ' + value).join('; '));

  /**
   * The two paragraphs.
   */
  @Query.all('.sample')
  public accessor samples!: QuerySignal<HTMLElement[]>;

  /**
   * The `style` attribute of each paragraph, as it is in the DOM.
   */
  public readonly attributesProp = computed(() => this.samples().map(sample => sample.getAttribute('style')));
}
