import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Conditional bindings" page, in English.
 */
@WebComponent({
  selector: 'page-templates-conditional-bindings-en',
  templateUrl: './conditional-bindings.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesConditionalBindingsPageEn extends CustomElement {}

/**
 * The "Conditional bindings" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-conditional-bindings-it',
  templateUrl: './conditional-bindings.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesConditionalBindingsPageIt extends CustomElement {}
