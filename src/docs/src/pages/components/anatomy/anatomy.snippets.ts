import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `attach-shadow.ts`, shown by the page components/anatomy and the API reference of core.
 */
export const ATTACH_SHADOW: SourceFile = {
  name: 'attach-shadow.ts',
  lang: 'ts',
  code: `// CustomElement has already attached an open shadow root in its constructor
this.attachShadow({ mode: 'closed' });
// ✗ NotSupportedError: Failed to execute 'attachShadow' on 'Element':
//   Shadow root cannot be created on a host which already hosts a shadow tree.`
};

/**
 * The snippet `copy-button.ts`, shown by the page components/anatomy and the API reference of core.
 */
export const COPY_BUTTON: SourceFile = {
  name: 'copy-button.ts',
  lang: 'ts',
  code: `// copy-button.xd.component.ts
import type { Output } from '@xaendar/core';
import { customElementOf, Event, HostListener, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A button copying a text to the clipboard. It is a native button, focused, clicked and pressed with the keyboard as
 * any other: <button> accepts no shadow root, so it has no template, and its label is its content.
 */
@WebComponent({ selector: 'copy-button', extends: 'button' })
export class CopyButtonComponent extends customElementOf(HTMLButtonElement) {
  /**
   * The text to copy.
   */
  @Property.required()
  public accessor text!: InputSignal<string>;
  /**
   * Emitted once the text is in the clipboard, with the text as detail.
   */
  @Event()
  public accessor copied!: Output<string>;

  /**
   * Copies the text when the button is clicked, or pressed with Enter or Space.
   */
  @HostListener('click')
  public async copy(): Promise<void> {
    const text = this.text();
    await navigator.clipboard.writeText(text);
    this.copied.dispatch(text);
  }
}`
};

/**
 * The snippet `generic-component.ts`, shown by the page components/anatomy.
 */
export const GENERIC_COMPONENT: SourceFile = {
  name: 'generic-component.ts',
  lang: 'ts',
  code: `// picker.xd.component.ts
@WebComponent({
  selector: 'ex-picker',
  templateUrl: './picker.xd.component.html'
})
export class PickerComponent<Item extends { id: number }, Key = string> extends CustomElement {
  @Property([]) accessor items!: InputSignal<Item[]>;
  @Event() accessor picked!: Output<Key>;
  @Event() accessor selected!: Output<Item>;
}`
};

/**
 * The snippet `non-literal-options.ts`, shown by the page components/anatomy and the API reference of core.
 */
export const NON_LITERAL_OPTIONS: SourceFile = {
  name: 'non-literal-options.ts',
  lang: 'ts',
  code: `/**
 * The path of the template.
 */
const TEMPLATE = './rating.xd.component.html';

/**
 * ✗ The template is not a string literal: the build fails.
 */
@WebComponent({ selector: 'ex-rating', templateUrl: TEMPLATE })
export class RatingComponent extends CustomElement {}`
};

/**
 * The snippet `note-panel.ts`, shown by the page components/anatomy and the API reference of core.
 */
export const NOTE_PANEL: SourceFile = {
  name: 'note-panel.ts',
  lang: 'ts',
  code: `// note-panel.xd.component.ts
/**
 * A panel with a heading. A <div> accepts a shadow root: the template is rendered there, as the one of any component,
 * and the stylesheet styles it.
 */
@WebComponent({
  selector: 'note-panel',
  extends: 'div',
  styleUrl: './note-panel.css',
  templateUrl: './note-panel.xd.component.html'
})
export class NotePanelComponent extends customElementOf(HTMLDivElement) {
  /**
   * The heading of the panel.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
}

// page-section.xd.component.ts
/**
 * A section of a page. The class of <section> is HTMLElement, whose customElementOf() is CustomElement itself: the
 * component extends it, as an autonomous custom element does.
 */
@WebComponent({
  selector: 'page-section',
  extends: 'section',
  templateUrl: './page-section.xd.component.html'
})
export class PageSectionComponent extends CustomElement {}`
};

/**
 * The snippet `web-component-options.ts`, shown by the page components/anatomy and the API reference of core.
 */
export const WEB_COMPONENT_OPTIONS: SourceFile = {
  name: 'web-component-options.ts',
  lang: 'ts',
  code: `/**
 * A five-star rating.
 */
@WebComponent({
  selector: 'ex-rating',                      // the custom element name: lowercase, with a hyphen, unique
  styleUrl: './rating.css',                   // optional, a .css file relative to this file
  templateUrl: './rating.xd.component.html'   // required, relative to this file
})
export class RatingComponent extends CustomElement {}`
};
