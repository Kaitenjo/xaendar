import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "What is Xaendar?" page, in English.
 */
@WebComponent({
  selector: 'page-overview-en',
  templateUrl: './overview.en.xd.component.html',
  styleUrl: '../page.css'
})
export class OverviewPageEn extends CustomElement {}

/**
 * The "What is Xaendar?" page, in Italian.
 */
@WebComponent({
  selector: 'page-overview-it',
  templateUrl: './overview.it.xd.component.html',
  styleUrl: '../page.css'
})
export class OverviewPageIt extends CustomElement {}
