import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Two panes, each with its own slot.
 */
@WebComponent({
  selector: 'ex-split-view',
  styleUrl: './split-view.css',
  templateUrl: './split-view.xd.component.html'
})
export class SplitViewComponent extends CustomElement {}
