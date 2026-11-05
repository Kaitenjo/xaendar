import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "@try and @catch" page.
 */
@WebComponent({
  selector: 'page-templates-try',
  styleUrl: '../../page.css',
  templateUrl: './try.xd.component.html'
})
export class TemplatesTryPage extends CustomElement {}
