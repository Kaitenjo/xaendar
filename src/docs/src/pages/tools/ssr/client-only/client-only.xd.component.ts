import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Browser-only rendering" page of server-side rendering.
 */
@WebComponent({
  selector: 'page-tools-ssr-client-only',
  styleUrl: '../../../page.css',
  templateUrl: './client-only.xd.component.html'
})
export class ToolsSsrClientOnlyPage extends CustomElement {

}
