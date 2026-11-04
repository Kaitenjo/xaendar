import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Custom directives" page.
 */
@WebComponent({
  selector: 'page-directives-custom',
  styleUrl: '../../page.css',
  templateUrl: './custom.xd.component.html'
})
export class DirectivesCustomPage extends CustomElement {}
