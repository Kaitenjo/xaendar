import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `entry-server.ts` giving the browser the data of a page, shown by the page tools/ssr/transfer-state and
 * the API reference of ssr.
 */
export const TRANSFER_STATE_ENTRY: SourceFile = {
  name: 'entry-server.ts',
  lang: 'ts',
  code: `/**
 * Renders the page of a URL on the server, with the data it shows.
 *
 * @param url - The path of the page, with its query string.
 * @returns The HTML of the component of the page.
 */
export async function render(url: string): Promise<string> {
  const { pathname } = new URL(url, 'http://localhost');
  const productId = /^\\/products\\/(\\w+)$/.exec(pathname)![1];
  // Fetched before the render, which does not wait for a request started by a component
  const product = await fetchProduct(productId);
  // productId goes into the data-xd-inputs attribute of the element, the product into the transfer state
  return renderToString(ProductPageComponent, { productId }, { state: { [\`product:\${productId}\`]: product } });
}`
};

/**
 * The snippet `product-page.xd.component.ts` reading the transfer state, shown by the page tools/ssr/transfer-state and
 * the API reference of core.
 */
export const TRANSFER_STATE_COMPONENT: SourceFile = {
  name: 'product-page.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, getTransferState, Property, WebComponent } from '@xaendar/core';
import { signal, type InputSignal } from '@xaendar/core/signals';
import { fetchProduct, type Product } from '../products.api';

/**
 * The page of a product.
 */
@WebComponent({
  selector: 'product-page',
  templateUrl: './product-page.xd.component.html'
})
export class ProductPageComponent extends CustomElement {
  /**
   * The id of the product: set by the entry on the server, and from data-xd-inputs in the browser.
   */
  @Property('')
  public accessor productId!: InputSignal<string>;
  /**
   * The product shown, null until it is loaded.
   */
  public readonly product = signal<Product | null>(null);

  public onInit(): void {
    // The same code on both sides: the server reads the state of the request, the browser the one written into the page
    const product = getTransferState<Product>(\`product:\${this.productId()}\`);
    if (product) {
      this.product.set(product);
    } else {
      // A page the server did not render, e.g. reached by a navigation in the browser
      fetchProduct(this.productId()).then(loaded => this.product.set(loaded));
    }
  }
}`
};
