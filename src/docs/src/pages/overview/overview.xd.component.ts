import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "What is Xaendar?" page.
 */
@WebComponent({
  selector: 'page-overview',
  styleUrl: '../page.css',
  templateUrl: './overview.xd.component.html'
})
export class OverviewPage extends CustomElement {}
