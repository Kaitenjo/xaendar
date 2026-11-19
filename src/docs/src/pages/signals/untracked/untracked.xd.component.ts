import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Reading without tracking" page.
 */
@WebComponent({
  selector: 'page-signals-untracked',
  styleUrl: '../../page.css',
  templateUrl: './untracked.xd.component.html'
})
export class SignalsUntrackedPage extends CustomElement {}
