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
