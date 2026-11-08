import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@defer (hover)`, whose content is rendered when the pointer moves over the button of its `@placeholder`, or the
 * focus enters it.
 */
@WebComponent({
  selector: 'ex-defer-hover',
  styleUrl: './defer-hover.css',
  templateUrl: './defer-hover.xd.component.html'
})
export class DeferHoverComponent extends CustomElement {}
