import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Directives overview" page, in English.
 */
@WebComponent({
  selector: 'page-directives-overview-en',
  templateUrl: './overview.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesOverviewPageEn extends CustomElement {}

/**
 * The "Directives overview" page, in Italian.
 */
@WebComponent({
  selector: 'page-directives-overview-it',
  templateUrl: './overview.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesOverviewPageIt extends CustomElement {}
