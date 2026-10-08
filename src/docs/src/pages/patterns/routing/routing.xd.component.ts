import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Routing" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-routing-en',
  templateUrl: './routing.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsRoutingPageEn extends CustomElement {}

/**
 * The "Routing" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-routing-it',
  templateUrl: './routing.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsRoutingPageIt extends CustomElement {}
