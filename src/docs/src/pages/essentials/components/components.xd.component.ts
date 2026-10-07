import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Components" page, in English.
 */
@WebComponent({
  selector: 'page-essentials-components-en',
  templateUrl: './components.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsComponentsPageEn extends CustomElement {}

/**
 * The "Components" page, in Italian.
 */
@WebComponent({
  selector: 'page-essentials-components-it',
  templateUrl: './components.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsComponentsPageIt extends CustomElement {}
