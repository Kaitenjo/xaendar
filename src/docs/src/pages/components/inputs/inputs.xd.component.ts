import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Inputs with @Property" page, in English.
 */
@WebComponent({
  selector: 'page-components-inputs-en',
  templateUrl: './inputs.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInputsPageEn extends CustomElement {}

/**
 * The "Inputs with @Property" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-inputs-it',
  templateUrl: './inputs.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInputsPageIt extends CustomElement {}
