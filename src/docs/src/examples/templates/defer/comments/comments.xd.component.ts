import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A post whose comments are shown at the first interaction with the button of the `@placeholder`: the component listing
 * them, rendered only by the content of the `@defer`, is in a chunk of its own, loaded only then.
 */
@WebComponent({
  selector: 'ex-comments',
  styleUrl: './comments.css',
  templateUrl: './comments.xd.component.html'
})
export class CommentsComponent extends CustomElement {}
