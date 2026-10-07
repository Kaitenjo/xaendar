import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Content projection with slots" page, in English.
 */
@WebComponent({
  selector: 'page-components-content-projection-en',
  templateUrl: './content-projection.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsContentProjectionPageEn extends CustomElement {}

/**
 * The "Content projection with slots" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-content-projection-it',
  templateUrl: './content-projection.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsContentProjectionPageIt extends CustomElement {}
