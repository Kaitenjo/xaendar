import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "SVG and MathML" page.
 */
@WebComponent({
  selector: 'page-templates-svg-mathml',
  styleUrl: '../../page.css',
  templateUrl: './svg-mathml.xd.component.html'
})
export class TemplatesSvgMathmlPage extends CustomElement {}
