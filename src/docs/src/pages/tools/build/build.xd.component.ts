import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Build and Vite plugin" page.
 */
@WebComponent({
  selector: 'page-tools-build',
  styleUrl: '../../page.css',
  templateUrl: './build.xd.component.html'
})
export class ToolsBuildPage extends CustomElement {}
