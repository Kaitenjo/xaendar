import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Dynamic templates" page.
 */
@WebComponent({
  selector: 'page-essentials-templates',
  styleUrl: '../../page.css',
  templateUrl: './templates.xd.component.html'
})
export class EssentialsTemplatesPage extends CustomElement {}
