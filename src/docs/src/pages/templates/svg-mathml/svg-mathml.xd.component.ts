import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "SVG and MathML" page, in English.
 */
@WebComponent({
  selector: 'page-templates-svg-mathml-en',
  templateUrl: './svg-mathml.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesSvgMathmlPageEn extends CustomElement {}

/**
 * The "SVG and MathML" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-svg-mathml-it',
  templateUrl: './svg-mathml.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesSvgMathmlPageIt extends CustomElement {}
