import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Using DOM APIs" page, in English.
 */
@WebComponent({
  selector: 'page-components-dom-apis-en',
  templateUrl: './dom-apis.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsDomApisPageEn extends CustomElement {}

/**
 * The "Using DOM APIs" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-dom-apis-it',
  templateUrl: './dom-apis.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsDomApisPageIt extends CustomElement {}
