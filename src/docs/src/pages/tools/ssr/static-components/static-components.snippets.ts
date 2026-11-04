import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet of a component kept in the bundle of the browser, shown by the page tools/ssr/static-components.
 */
export const STATIC_OPT_OUT: SourceFile = {
  name: 'price.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';

// A script of the page reads this element: the build cannot see it, and would leave the class out
@WebComponent({
  selector: 'app-price',
  ssr: { static: false },
  templateUrl: './price.xd.component.html'
})
export class PriceComponent extends CustomElement { }`
};
