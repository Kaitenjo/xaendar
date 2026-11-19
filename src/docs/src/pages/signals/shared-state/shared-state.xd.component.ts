import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Sharing state" page.
 */
@WebComponent({
  selector: 'page-signals-shared-state',
  styleUrl: '../../page.css',
  templateUrl: './shared-state.xd.component.html'
})
export class SignalsSharedStatePage extends CustomElement {}
