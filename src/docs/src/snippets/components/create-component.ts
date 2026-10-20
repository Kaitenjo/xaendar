/**
 * Shows a dialog over the page, created in code.
 */
export class EditorComponent extends CustomElement {
  /**
   * The title of the dialog.
   */
  public readonly heading = signal('Unsaved changes');

  /**
   * Asks the user to confirm, appending the dialog to the body.
   */
  public confirm(): void {
    const dialog = createComponent(ConfirmDialogComponent, {
      target: document.body,
      // Read in an effect: the input follows heading
      properties: [{ heading: () => this.heading() }],
      events: [{ closed: () => { dialog.destroy(); } }]
    });
    // The instance of the component, already in the DOM
    dialog.element.focus();
  }
}
