import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The comments of the post. Only the content of a `@defer` renders it, so its module is loaded when the `@defer` needs
 * it, not with the page.
 */
@WebComponent({
  selector: 'ex-comment-list',
  templateUrl: './comment-list.xd.component.html'
})
export class CommentListComponent extends CustomElement {
  /**
   * The comments.
   */
  public readonly comments = ['Clear and short.', 'The counter example helped.', 'More on effects, please.'];
}
