import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Lists and CRUD" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-lists-en',
  templateUrl: './lists.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsListsPageEn extends CustomElement {}

/**
 * The "Lists and CRUD" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-lists-it',
  templateUrl: './lists.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsListsPageIt extends CustomElement {}
