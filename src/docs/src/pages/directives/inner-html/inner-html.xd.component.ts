import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Inner HTML" page.
 */
@WebComponent({
  selector: 'page-directives-inner-html',
  styleUrl: '../../page.css',
  templateUrl: './inner-html.xd.component.html'
})
export class DirectivesInnerHtmlPage extends CustomElement {}
