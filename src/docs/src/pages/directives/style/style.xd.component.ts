import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Styles" page.
 */
@WebComponent({
  selector: 'page-directives-style',
  styleUrl: '../../page.css',
  templateUrl: './style.xd.component.html'
})
export class DirectivesStylePage extends CustomElement {}
