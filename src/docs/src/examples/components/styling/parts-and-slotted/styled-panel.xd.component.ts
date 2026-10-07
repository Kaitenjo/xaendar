import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A panel exposing its header as a part, and styling the content projected into it.
 */
@WebComponent({
  selector: 'ex-styled-panel',
  templateUrl: './styled-panel.xd.component.html',
  styleUrl: './styled-panel.css'
})
export class StyledPanelComponent extends CustomElement {}
