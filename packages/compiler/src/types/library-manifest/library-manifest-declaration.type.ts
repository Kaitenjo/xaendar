import type { ClassTypeParameter } from '../class-type-parameter.type';
import type { LibraryManifestBinding } from './library-manifest-binding.type';
import type { LibraryManifestInput } from './library-manifest-input.type';

/**
 * A component or a directive of a compiled library, as its manifest describes it.
 */
export type LibraryManifestDeclaration = {
  /**
   * Whether it is a component or a directive.
   */
  type: 'component' | 'directive';
  /**
   * The name of its class, in the module declaring it.
   */
  className: string;
  /**
   * The tag name of the component, or the selector of the directive.
   */
  selector: string;
  /**
   * The path of the `exports` of the package leading to the module declaring it (`./button/button.xd.component`): an
   * application imports it for the module to define it.
   */
  module: string;
  /**
   * The declarations of the module, relative to the root of the package (`./button/button.xd.component.d.ts`).
   */
  types: string;
  /**
   * The type parameters of its class, if it is generic.
   */
  typeParameters?: ClassTypeParameter[];
  /**
   * Its inputs, the ones its host directives expose included.
   */
  inputs: LibraryManifestInput[];
  /**
   * Its events, the ones its host directives expose included.
   */
  events: LibraryManifestBinding[];
  /**
   * The rendering on the server of a component declaring `ssr: { render: false }`, which renders only in the browser.
   */
  ssr?: { render: false, hydrate?: string };
};
