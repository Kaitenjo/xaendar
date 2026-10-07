import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A chip whose look depends only on its host element: hover, the `selected` class and the `tone` attribute.
 */
@WebComponent({
  selector: 'ex-chip',
  templateUrl: './chip.xd.component.html',
  styleUrl: './chip.css'
})
export class ChipComponent extends CustomElement {}
