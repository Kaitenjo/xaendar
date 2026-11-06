import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A post whose comments are shown at the first interaction with the button of the `@placeholder`: the component listing
 * them, rendered only by the content of the `@defer`, is in a chunk of its own, loaded as soon as the pointer moves over
 * the button. The `@loading` is shown only when the chunk takes longer than 100 milliseconds, then for half a second at
 * least.
 */
@WebComponent({
  selector: 'ex-comments',
  styleUrl: './comments.css',
  templateUrl: './comments.xd.component.html'
})
export class CommentsComponent extends CustomElement {}
