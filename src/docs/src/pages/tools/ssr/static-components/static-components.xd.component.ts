import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Static components" page of server-side rendering.
 */
@WebComponent({
  selector: 'page-tools-ssr-static-components',
  styleUrl: '../../../page.css',
  templateUrl: './static-components.xd.component.html'
})
export class ToolsSsrStaticComponentsPage extends CustomElement {

}
