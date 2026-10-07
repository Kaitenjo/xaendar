import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Two paragraphs with the same class, one in this component and one in its child: each stylesheet only reaches its
 * own one.
 */
@WebComponent({
  selector: 'ex-encapsulation',
  templateUrl: './encapsulation.xd.component.html',
  styleUrl: './encapsulation.css'
})
export class EncapsulationComponent extends CustomElement {}
