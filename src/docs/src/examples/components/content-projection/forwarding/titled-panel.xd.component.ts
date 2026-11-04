import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A panel built on a card: its own slots are projected, in turn, into the slots of the card.
 */
@WebComponent({
  selector: 'ex-titled-panel',
  templateUrl: './titled-panel.xd.component.html'
})
export class TitledPanelComponent extends CustomElement {}
