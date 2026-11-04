import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Lists with @for" page.
 */
@WebComponent({
  selector: 'page-templates-for',
  styleUrl: '../../page.css',
  templateUrl: './for.xd.component.html'
})
export class TemplatesForPage extends CustomElement {}
