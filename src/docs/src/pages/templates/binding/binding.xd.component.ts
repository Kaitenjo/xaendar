import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Attribute and property binding" page, in English.
 */
@WebComponent({
  selector: 'page-templates-binding-en',
  templateUrl: './binding.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesBindingPageEn extends CustomElement {}

/**
 * The "Attribute and property binding" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-binding-it',
  templateUrl: './binding.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesBindingPageIt extends CustomElement {}
