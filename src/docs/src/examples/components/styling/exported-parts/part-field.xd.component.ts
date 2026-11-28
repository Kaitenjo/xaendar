import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A field holding a button, whose label it forwards to its users as its own part.
 */
@WebComponent({
  selector: 'ex-part-field',
  styleUrl: './part-field.css',
  templateUrl: './part-field.xd.component.html'
})
export class PartFieldComponent extends CustomElement { }
