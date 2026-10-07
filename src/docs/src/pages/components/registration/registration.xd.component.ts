import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Selectors and registration" page, in English.
 */
@WebComponent({
  selector: 'page-components-registration-en',
  templateUrl: './registration.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsRegistrationPageEn extends CustomElement {}

/**
 * The "Selectors and registration" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-registration-it',
  templateUrl: './registration.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsRegistrationPageIt extends CustomElement {}
