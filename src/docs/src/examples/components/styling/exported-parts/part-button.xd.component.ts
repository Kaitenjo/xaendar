import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A button exposing itself and its label as parts.
 */
@WebComponent({
  selector: 'ex-part-button',
  styleUrl: './part-button.css',
  templateUrl: './part-button.xd.component.html'
})
export class PartButtonComponent extends CustomElement { }
