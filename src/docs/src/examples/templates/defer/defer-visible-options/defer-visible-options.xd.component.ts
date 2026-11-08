import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@defer (visible(frame, { threshold: 1 }))`, whose content is rendered once the element named `frame`, written after
 * the block, is entirely in the viewport: here, when the box is scrolled down to its end.
 */
@WebComponent({
  selector: 'ex-defer-visible-options',
  styleUrl: './defer-visible-options.css',
  templateUrl: './defer-visible-options.xd.component.html'
})
export class DeferVisibleOptionsComponent extends CustomElement {}
