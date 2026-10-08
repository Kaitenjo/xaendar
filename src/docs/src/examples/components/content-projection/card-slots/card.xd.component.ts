import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A card with three slots: header, with a fallback, the default one and footer.
 */
@WebComponent({
  selector: 'ex-card',
  templateUrl: './card.xd.component.html',
  styleUrl: './card.css'
})
export class CardComponent extends CustomElement {}
