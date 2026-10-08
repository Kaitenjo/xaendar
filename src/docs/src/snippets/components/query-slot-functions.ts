import { CustomElement, querySlot, querySlotAll } from '@xaendar/core';

export class FormFieldComponent extends CustomElement {
  // The same as @Query.content and @Query.content.all, created in a field
  public readonly control = querySlot<string, HTMLInputElement>(this, 'input');
  public readonly hints = querySlotAll(this, '.hint', { slots: 'hint' });
}
