import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Uses a panel that forwards its slots to the slots of a card.
 */
@WebComponent({
  selector: 'ex-forwarding',
  styleUrl: './forwarding.css',
  templateUrl: './forwarding.xd.component.html'
})
export class ForwardingComponent extends CustomElement {}
