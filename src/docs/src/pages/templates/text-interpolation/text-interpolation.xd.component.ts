import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Text interpolation" page, in English.
 */
@WebComponent({
  selector: 'page-templates-text-interpolation-en',
  templateUrl: './text-interpolation.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesTextInterpolationPageEn extends CustomElement {}

/**
 * The "Text interpolation" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-text-interpolation-it',
  templateUrl: './text-interpolation.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesTextInterpolationPageIt extends CustomElement {}
