import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Event listeners" page, in English.
 */
@WebComponent({
  selector: 'page-templates-events-en',
  templateUrl: './events.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesEventsPageEn extends CustomElement {}

/**
 * The "Event listeners" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-events-it',
  templateUrl: './events.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesEventsPageIt extends CustomElement {}
