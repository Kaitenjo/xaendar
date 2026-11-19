import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Signals overview" page.
 */
@WebComponent({
  selector: 'page-signals-overview',
  styleUrl: '../../page.css',
  templateUrl: './overview.xd.component.html'
})
export class SignalsOverviewPage extends CustomElement {}
