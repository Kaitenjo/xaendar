import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A `@defer (interaction)`, whose content is rendered at the first click, key or focus on the button of its
 * `@placeholder`, which it then replaces.
 */
@WebComponent({
  selector: 'ex-defer-interaction',
  styleUrl: './defer-interaction.css',
  templateUrl: './defer-interaction.xd.component.html'
})
export class DeferInteractionComponent extends CustomElement {}
