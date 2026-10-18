// can-edit.directive.ts
/**
 * Renders the element only when the server allows the user to edit the document.
 */
@Directive({ selector: 'exCanEdit' })
export class CanEditDirective extends StructuralDirective {
  /**
   * The document to check.
   */
  @Property.required()
  public accessor documentId!: InputSignal<string>;

  /**
   * Asks the server: evaluated again whenever the document changes.
   *
   * @returns Whether the user can edit the document.
   */
  public async shouldRender(): Promise<boolean> {
    // Read before the first await, so it is tracked: the signals read after it are not
    const documentId = this.documentId();
    try {
      const response = await fetch(`/api/documents/${documentId}/permissions`);
      const permissions: { canEdit: boolean } = await response.json();
      return permissions.canEdit;
    } catch {
      // A rejected promise would keep the previous outcome: a failure hides the element instead
      return false;
    }
  }
}
