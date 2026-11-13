import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `user-list.xd.component.ts`, shown by the page templates/reusable-templates.
 */
export const TEMPLATE_RECEIVER: SourceFile = {
  name: 'user-list.xd.component.ts',
  lang: 'ts',
  code: `@WebComponent({
  selector: 'user-list',
  templateUrl: './user-list.xd.component.html'
})
export class UserListComponent extends CustomElement {
  /**
   * The users to list.
   */
  @Property<InputSignal<User[]>>([])
  public accessor users!: InputSignal<User[]>;
  /**
   * The template passed as content: <template row(user: User)> among the children of <user-list>.
   */
  @Query.contentTemplate<[user: User]>('row')
  public accessor row!: QuerySignal<TemplateRef<[user: User]> | null>;
  /**
   * A template passed as an input: emptyTemplate="{nothing}".
   */
  @Property<InputSignal<TemplateRef<[]> | null>>(null)
  public accessor emptyTemplate!: InputSignal<TemplateRef<[]> | null>;
}`
};
