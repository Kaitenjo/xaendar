import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@defer (interaction(edit))`, whose content is rendered at the first click on the button named `edit`, written
 * before the block: the button is not part of the block, so it stays once the content is rendered.
 */
@WebComponent({
  selector: 'ex-defer-target',
  styleUrl: './defer-target.css',
  templateUrl: './defer-target.xd.component.html'
})
export class DeferTargetComponent extends CustomElement {}
