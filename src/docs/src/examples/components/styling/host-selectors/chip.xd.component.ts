import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A chip whose look depends only on its host element: hover, the `selected` class and the `tone` attribute.
 */
@WebComponent({
  selector: 'ex-chip',
  styleUrl: './chip.css',
  templateUrl: './chip.xd.component.html'
})
export class ChipComponent extends CustomElement {}
