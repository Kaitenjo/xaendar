import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Signals overview" page, in English.
 */
@WebComponent({
  selector: 'page-signals-overview-en',
  templateUrl: './overview.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsOverviewPageEn extends CustomElement {}

/**
 * The "Signals overview" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-overview-it',
  templateUrl: './overview.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsOverviewPageIt extends CustomElement {}
