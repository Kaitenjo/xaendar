import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A card with three slots: header, with a fallback, the default one and footer.
 */
@WebComponent({
  selector: 'ex-card',
  styleUrl: './card.css',
  templateUrl: './card.xd.component.html'
})
export class CardComponent extends CustomElement {}
