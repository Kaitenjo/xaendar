import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Dynamic templates" page, in English.
 */
@WebComponent({
  selector: 'page-essentials-templates-en',
  templateUrl: './templates.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsTemplatesPageEn extends CustomElement {}

/**
 * The "Dynamic templates" page, in Italian.
 */
@WebComponent({
  selector: 'page-essentials-templates-it',
  templateUrl: './templates.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsTemplatesPageIt extends CustomElement {}
