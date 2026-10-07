import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Sharing state" page, in English.
 */
@WebComponent({
  selector: 'page-signals-shared-state-en',
  templateUrl: './shared-state.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsSharedStatePageEn extends CustomElement {}

/**
 * The "Sharing state" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-shared-state-it',
  templateUrl: './shared-state.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsSharedStatePageIt extends CustomElement {}
