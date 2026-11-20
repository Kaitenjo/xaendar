import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Framework comparison" page: the same page written with Angular, React and Xaendar, one frame each.
 */
@WebComponent({
  selector: 'page-reference-framework-comparison',
  styleUrl: '../../page.css',
  templateUrl: './framework-comparison.xd.component.html'
})
export class ReferenceFrameworkComparisonPage extends CustomElement {
  /**
   * The pages of the comparison, in the order they are shown: the name of the framework, and the page relative
   * to the documentation site (its folder under `src/docs/comparison`, built into `public/comparison`). The
   * file is named, since the dev server answers a folder with the documentation itself.
   */
  public readonly frames = [
    { label: 'Angular', src: 'comparison/angular/index.html' },
    { label: 'React', src: 'comparison/react/index.html' },
    { label: 'Xaendar', src: 'comparison/xaendar/index.html' }
  ] as const;
}
