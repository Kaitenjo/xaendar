import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Lifecycle" page, in English.
 */
@WebComponent({
  selector: 'page-components-lifecycle-en',
  templateUrl: './lifecycle.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsLifecyclePageEn extends CustomElement {}

/**
 * The "Lifecycle" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-lifecycle-it',
  templateUrl: './lifecycle.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsLifecyclePageIt extends CustomElement {}
