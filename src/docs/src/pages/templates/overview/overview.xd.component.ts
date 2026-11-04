import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Template syntax" page.
 */
@WebComponent({
  selector: 'page-templates-overview',
  styleUrl: '../../page.css',
  templateUrl: './overview.xd.component.html'
})
export class TemplatesOverviewPage extends CustomElement {}
