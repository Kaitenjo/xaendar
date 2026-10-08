import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Branching with @switch" page, in English.
 */
@WebComponent({
  selector: 'page-templates-switch-en',
  templateUrl: './switch.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesSwitchPageEn extends CustomElement {}

/**
 * The "Branching with @switch" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-switch-it',
  templateUrl: './switch.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesSwitchPageIt extends CustomElement {}
