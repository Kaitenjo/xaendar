import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A panel exposing its header as a part, and styling the content projected into it.
 */
@WebComponent({
  selector: 'ex-styled-panel',
  styleUrl: './styled-panel.css',
  templateUrl: './styled-panel.xd.component.html'
})
export class StyledPanelComponent extends CustomElement {}
