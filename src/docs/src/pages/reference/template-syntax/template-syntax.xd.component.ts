import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Template syntax cheat sheet" page.
 */
@WebComponent({
  selector: 'page-reference-template-syntax',
  templateUrl: './template-syntax.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceTemplateSyntaxPage extends CustomElement {}
