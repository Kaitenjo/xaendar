import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Anatomy of a component" page, in English.
 */
@WebComponent({
  selector: 'page-components-anatomy-en',
  templateUrl: './anatomy.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsAnatomyPageEn extends CustomElement {}

/**
 * The "Anatomy of a component" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-anatomy-it',
  templateUrl: './anatomy.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsAnatomyPageIt extends CustomElement {}
