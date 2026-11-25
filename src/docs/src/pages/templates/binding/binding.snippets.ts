import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `place-map.xd.component.ts`, shown by the page templates/binding and the API reference of core.
 */
export const TRUSTED_URLS: SourceFile = {
  name: 'place-map.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, Property, trustResourceUrl, trustUrl, WebComponent, type SafeResourceUrl } from '@xaendar/core';
import { computed, type InputSignal } from '@xaendar/core/signals';

/**
 * Shows a place on the map the company serves from its own domain, with a link printing the page.
 */
@WebComponent({
  selector: 'ex-place-map',
  templateUrl: './place-map.xd.component.html'
})
export class PlaceMapComponent extends CustomElement {
  /**
   * The place to show.
   */
  @Property('')
  public accessor place!: InputSignal<string>;
  /**
   * The link printing the page: it runs code, the application writes it.
   */
  public readonly print = trustUrl('javascript:window.print()');
  /**
   * The page of the map, loaded into the frame from an origin the application trusts here only.
   */
  public readonly map = computed(() => this._computeMap());

  /**
   * Computes the value of \`map\`.
   *
   * @returns The page of the map, trusted to load into the frame.
   */
  private _computeMap(): SafeResourceUrl {
    return trustResourceUrl(\`https://maps.example.com/embed?q=\${encodeURIComponent(this.place())}\`);
  }
}`
};
