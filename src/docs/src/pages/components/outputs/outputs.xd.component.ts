import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Outputs with @Event" page, in English.
 */
@WebComponent({
  selector: 'page-components-outputs-en',
  templateUrl: './outputs.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsOutputsPageEn extends CustomElement {}

/**
 * The "Outputs with @Event" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-outputs-it',
  templateUrl: './outputs.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsOutputsPageIt extends CustomElement {}
