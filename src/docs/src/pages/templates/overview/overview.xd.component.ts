import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Template syntax" page, in English.
 */
@WebComponent({
  selector: 'page-templates-overview-en',
  templateUrl: './overview.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesOverviewPageEn extends CustomElement {}

/**
 * The "Template syntax" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-overview-it',
  templateUrl: './overview.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesOverviewPageIt extends CustomElement {}
