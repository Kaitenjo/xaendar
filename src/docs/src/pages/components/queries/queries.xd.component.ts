import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "View queries" page, in English.
 */
@WebComponent({
  selector: 'page-components-queries-en',
  templateUrl: './queries.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsQueriesPageEn extends CustomElement {}

/**
 * The "View queries" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-queries-it',
  templateUrl: './queries.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsQueriesPageIt extends CustomElement {}
