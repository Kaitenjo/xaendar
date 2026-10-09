import { CustomElement, querySlot, querySlotAll } from '@xaendar/core';

/**
 * A form field querying the content projected into it with the function forms.
 */
export class FormFieldComponent extends CustomElement {
  /**
   * The same as Query.content, created in a field.
   */
  public readonly control = querySlot<string, HTMLInputElement>(this, 'input');
  /**
   * The same as Query.content.all, created in a field, limited to the hint slot.
   */
  public readonly hints = querySlotAll(this, '.hint', { slots: 'hint' });
}
