import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { InputSignal } from '@xaendar/core/signals';

/**
 * Shows the current value of its properties, to see a property binding being applied and removed.
 */
@WebComponent({
  selector: 'app-binding-preview',
  styleUrl: './binding-preview.component.css',
  templateUrl: './binding-preview.xd.component.html',
})
export class BindingPreviewComponent extends CustomElement {
  @Property('non collegata')
  public accessor value!: InputSignal<string>;

  @Property('non collegata')
  public accessor detail!: InputSignal<string>;

  /**
   * Tells whether a property value comes from a binding rather than from its default.
   *
   * @param value - The current value of the property.
   * @returns `true` if the property is bound.
   */
  public isBound(value: string): boolean {
    return value !== 'non collegata';
  }
}
