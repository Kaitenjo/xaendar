import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `create-component-content.ts`, shown by the page components/dynamic-creation and the API reference of core.
 */
export const CREATE_COMPONENT_CONTENT: SourceFile = {
  name: 'create-component-content.ts',
  lang: 'ts',
  code: `const heading = document.createElement('h2');
heading.slot = 'header';
heading.textContent = 'Unsaved changes';
const body = document.createRange().createContextualFragment('<p>Leave the page?</p><p>The changes will be lost.</p>');

this.createComponent(ConfirmDialogComponent, {
  target: document.body,
  // The heading goes to <slot name="header" />, the paragraphs of the fragment to the default slot
  content: [heading, body]
});`
};

/**
 * The snippet `create-component.ts`, shown by the page components/dynamic-creation and the API reference of core.
 */
export const CREATE_COMPONENT: SourceFile = {
  name: 'create-component.ts',
  lang: 'ts',
  code: `/**
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
    // Destroyed along with this component, unless destroy is called first
    const dialog = this.createComponent(ConfirmDialogComponent, {
      target: document.body,
      // Read in an effect: the input follows heading
      properties: [{ heading: () => this.heading() }],
      events: [{ closed: () => { dialog.destroy(); } }]
    });
    // The instance of the component, already in the DOM
    dialog.element.focus();
  }
}`
};
