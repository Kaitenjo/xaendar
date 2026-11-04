import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet of a component hydrating once it is visible, shown by the page tools/ssr/progressive-hydration and the
 * API reference of core.
 */
export const HYDRATE_COMPONENT: SourceFile = {
  name: 'reviews.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';

// Rendered on the server, it hydrates once it enters the viewport: until then the page shows its HTML
@WebComponent({
  selector: 'app-reviews',
  ssr: { hydrate: 'visible' },
  templateUrl: './reviews.xd.component.html'
})
export class ReviewsComponent extends CustomElement { }`
};
