import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "CLI" page.
 */
@WebComponent({
  selector: 'page-tools-cli',
  styleUrl: '../../page.css',
  templateUrl: './cli.xd.component.html'
})
export class ToolsCliPage extends CustomElement {}
