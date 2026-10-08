import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Two panes, each with its own slot.
 */
@WebComponent({
  selector: 'ex-split-view',
  templateUrl: './split-view.xd.component.html',
  styleUrl: './split-view.css'
})
export class SplitViewComponent extends CustomElement {}
