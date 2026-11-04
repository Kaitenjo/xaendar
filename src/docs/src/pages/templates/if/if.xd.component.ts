import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Conditionals with @if" page.
 */
@WebComponent({
  selector: 'page-templates-if',
  styleUrl: '../../page.css',
  templateUrl: './if.xd.component.html'
})
export class TemplatesIfPage extends CustomElement {}
