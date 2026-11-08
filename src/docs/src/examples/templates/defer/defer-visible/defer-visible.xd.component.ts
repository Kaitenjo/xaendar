import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@defer (visible)`, whose content is rendered when the frame of its `@placeholder` enters the viewport: here, when
 * the box is scrolled down to it. The frame has the size of the content, so that nothing moves when it arrives.
 */
@WebComponent({
  selector: 'ex-defer-visible',
  styleUrl: './defer-visible.css',
  templateUrl: './defer-visible.xd.component.html'
})
export class DeferVisibleComponent extends CustomElement {}
