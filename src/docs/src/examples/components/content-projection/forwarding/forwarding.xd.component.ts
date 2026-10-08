import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Uses a panel that forwards its slots to the slots of a card.
 */
@WebComponent({
  selector: 'ex-forwarding',
  templateUrl: './forwarding.xd.component.html',
  styleUrl: './forwarding.css'
})
export class ForwardingComponent extends CustomElement {}
