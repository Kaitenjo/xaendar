import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { input } from '../../../../../packages/core/src/signals/input/input';

/**
 * The root of the documentation: top bar, navigation and the page being read.
 */
@WebComponent({
  selector: 'docs-app',
  styleUrl: './docs-app.xd.component.css',
  templateUrl: './docs-app.xd.component.html'
})
export class DocsAppComponent extends CustomElement {

  public a;

  constructor() {
     super();
     this.a = [];
     for (let i = 0; i < 100000; i++) {
      this.a.push(
        signal(undefined),
        input(),
        computed(() => {})
      )
     }
  }
}