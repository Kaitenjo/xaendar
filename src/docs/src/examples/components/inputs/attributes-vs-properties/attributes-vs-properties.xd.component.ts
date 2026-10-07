import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Binds the same input with a static value and with an expression, then writes the attribute of the same name from
 * outside.
 */
@WebComponent({
  selector: 'ex-attributes-vs-properties',
  templateUrl: './attributes-vs-properties.xd.component.html',
  styleUrl: './attributes-vs-properties.css'
})
export class AttributesVsPropertiesComponent extends CustomElement {
  /**
   * The first component, bound with a static value.
   */
  @Query('ex-value-type')
  public accessor first!: QuerySignal<HTMLElement | null>;

  /**
   * The attributes of the first component, as they are in the DOM.
   */
  public readonly attributes = signal('none');

  /**
   * Writes the value attribute of the first component, as code outside Xaendar would do.
   */
  public writeAttribute(): void {
    const first = this.first();
    if (first) {
      first.setAttribute('value', '42');
      this.attributes.set([...first.attributes].map(({ name, value }) => `${name}="${value}"`).join(' '));
    }
  }
}
