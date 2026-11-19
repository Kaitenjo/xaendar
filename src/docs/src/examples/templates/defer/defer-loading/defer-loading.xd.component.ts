import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@loading (minimum 1s)`: the report, whose component only the content of the `@defer` renders, is in a chunk of
 * its own, loaded at the first click on the button. Meanwhile the `@loading` is shown, then for a second at least.
 */
@WebComponent({
  selector: 'ex-defer-loading',
  styleUrl: './defer-loading.css',
  templateUrl: './defer-loading.xd.component.html'
})
export class DeferLoadingComponent extends CustomElement {}
