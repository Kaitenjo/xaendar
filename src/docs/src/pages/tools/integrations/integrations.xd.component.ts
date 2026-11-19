import { CustomElement, WebComponent } from '@xaendar/core';
import componentCode from '../../../../demos/qty-picker/src/qty-picker.xd.component.ts?raw';
import templateCode from '../../../../demos/qty-picker/src/qty-picker.xd.component.html?raw';
import entryCode from '../../../../demos/qty-picker/src/public-api.ts?raw';
import configCode from '../../../../demos/qty-picker/vite.config.ts?raw';
import startCode from '../../../../demos/react/src/main.tsx?raw';
import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The "Using Xaendar with other frameworks" page.
 *
 * The files of the component shown here are read from the library project the demo applications of this page
 * embed, so the code on the page is the code that runs in them.
 */
@WebComponent({
  selector: 'page-tools-integrations',
  styleUrl: '../../page.css',
  templateUrl: './integrations.xd.component.html'
})
export class ToolsIntegrationsPage extends CustomElement {
  /**
   * The class of the component the demo applications embed.
   */
  public readonly component: SourceFile = { name: 'qty-picker.xd.component.ts', lang: 'ts', code: componentCode };
  /**
   * The template of that component.
   */
  public readonly template: SourceFile = { name: 'qty-picker.xd.component.html', lang: 'html', code: templateCode };
  /**
   * The entry point of the library, which defines the element.
   */
  public readonly entry: SourceFile = { name: 'public-api.ts', lang: 'ts', code: entryCode };
  /**
   * The build of the library.
   */
  public readonly config: SourceFile = { name: 'vite.config.ts', lang: 'ts', code: configCode };
  /**
   * The entry point of a host application, the one of the React demo of this page.
   */
  public readonly start: SourceFile = { name: 'main.tsx', lang: 'ts', code: startCode };
}
