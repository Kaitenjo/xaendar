import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A child with a paragraph of the same class as the one of its parent.
 */
@WebComponent({
  selector: 'ex-encapsulated',
  templateUrl: './encapsulated.xd.component.html',
  styleUrl: './encapsulated.css'
})
export class EncapsulatedComponent extends CustomElement {}
