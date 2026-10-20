import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `generated-component.ts`, shown by the page tools/cli.
 */
export const GENERATED_COMPONENT: SourceFile = {
  name: 'generated-component.ts',
  lang: 'ts',
  code: `// user-card/user-card.xd.component.ts
import { CustomElement, WebComponent } from '@xaendar/core';

@WebComponent({
  selector: 'user-card',
  styleUrl: './user-card.xd.component.css',
  templateUrl: './user-card.xd.component.html'
})
export class UserCardComponent extends CustomElement {

}

// user-card/user-card.xd.component.html
<p>user-card works!</p>`
};
