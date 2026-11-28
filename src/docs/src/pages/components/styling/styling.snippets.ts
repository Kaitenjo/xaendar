import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `several-stylesheets.ts`, shown by the page components/styling and the API reference of core.
 */
export const SEVERAL_STYLESHEETS: SourceFile = {
  name: 'several-stylesheets.ts',
  lang: 'ts',
  code: `// card.xd.component.ts
// base.css is one CSSStyleSheet, shared by every component listing it; card.css comes after it and wins on a tie
@WebComponent({
  selector: 'app-card',
  styleUrl: ['../../styles/base.css', './card.css'],
  templateUrl: './card.xd.component.html'
})
export class CardComponent extends CustomElement { }`
};
