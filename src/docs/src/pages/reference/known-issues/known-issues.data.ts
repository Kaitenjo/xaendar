import type { Messages } from '../../../core/i18n/i18n';

/**
 * The kinds of known issues.
 */
export type IssueKind = 'bug' | 'limitation' | 'docs';

/**
 * A problem of the framework or of its tools, as found while writing this site.
 */
export type IssueEntry = {
  /**
   * The key of the texts of the issue (title, details and workaround) in the `issues` texts.
   */
  readonly id: keyof Messages['issues'];
  /**
   * The area of the framework involved.
   */
  readonly area: 'Compiler' | 'Runtime' | 'Signals' | 'Build' | 'CLI' | 'Editor' | 'Docs';
  /**
   * Whether it is a defect, a limitation of the design, or a documentation mismatch.
   */
  readonly kind: IssueKind;
  /**
   * The path of the page showing it.
   */
  readonly page: string;
};

/**
 * Every known issue, verified while writing the site, grouped by area.
 */
export const ISSUES: readonly IssueEntry[] = [
  {
    id: 'style-options-the-plugin-cannot-compile',
    area: 'CLI',
    kind: 'bug',
    page: 'tools/cli'
  },
  {
    id: 'the-published-packages-predate-this-documentation',
    area: 'CLI',
    kind: 'bug',
    page: 'tools/cli'
  },
  {
    id: 'the-language-server-never-compiles-a',
    area: 'Editor',
    kind: 'bug',
    page: 'tools/language-service'
  },
  {
    id: 'the-grammar-highlights-instead-of',
    area: 'Editor',
    kind: 'bug',
    page: 'tools/language-service'
  },
  {
    id: 'documentation-inside-the-packages-is-out',
    area: 'Docs',
    kind: 'docs',
    page: 'signals/effects'
  }
];
