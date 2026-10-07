import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Content queries" page, in English.
 */
@WebComponent({
  selector: 'page-components-content-queries-en',
  templateUrl: './content-queries.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsContentQueriesPageEn extends CustomElement {}

/**
 * The "Content queries" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-content-queries-it',
  templateUrl: './content-queries.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsContentQueriesPageIt extends CustomElement {}
