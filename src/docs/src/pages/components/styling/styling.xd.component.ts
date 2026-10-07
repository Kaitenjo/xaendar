import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Styling" page, in English.
 */
@WebComponent({
  selector: 'page-components-styling-en',
  templateUrl: './styling.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsStylingPageEn extends CustomElement {}

/**
 * The "Styling" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-styling-it',
  templateUrl: './styling.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsStylingPageIt extends CustomElement {}
