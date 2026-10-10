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
    id: 'html-inside-foreignobject-is-created-as',
    area: 'Compiler',
    kind: 'bug',
    page: 'templates/svg-mathml'
  },
  {
    id: 'a-space-between-two-interpolations-disappears',
    area: 'Compiler',
    kind: 'bug',
    page: 'templates/text-interpolation'
  },
  {
    id: 'a-shorthand-object-in-an-interpolation',
    area: 'Compiler',
    kind: 'bug',
    page: 'templates/text-interpolation'
  },
  {
    id: 'newlines-are-removed-and-entities-are',
    area: 'Compiler',
    kind: 'limitation',
    page: 'templates/overview'
  },
  {
    id: 'signal-members-are-detected-by-syntax',
    area: 'Compiler',
    kind: 'limitation',
    page: 'signals/shared-state'
  },
  {
    id: 'a-method-reading-signals-is-evaluated',
    area: 'Compiler',
    kind: 'limitation',
    page: 'templates/binding'
  },
  {
    id: 'members-named-history-or-location',
    area: 'Compiler',
    kind: 'limitation',
    page: 'templates/expressions'
  },
  {
    id: 'output-without-a-type-no-event',
    area: 'Compiler',
    kind: 'limitation',
    page: 'components/outputs'
  },
  {
    id: 'every-tag-with-a-dash-must',
    area: 'Compiler',
    kind: 'limitation',
    page: 'components/registration'
  },
  {
    id: 'a-child-is-rendered-before-the',
    area: 'Runtime',
    kind: 'bug',
    page: 'components/inputs'
  },
  {
    id: 'rows-of-for-keep-the-item',
    area: 'Runtime',
    kind: 'bug',
    page: 'templates/for'
  },
  {
    id: 'switch-evaluates-its-expression-once-per',
    area: 'Runtime',
    kind: 'bug',
    page: 'templates/switch'
  },
  {
    id: 'a-query-created-after-the-connection',
    area: 'Runtime',
    kind: 'bug',
    page: 'components/queries'
  },
  {
    id: 'an-effect-created-in-the-constructor',
    area: 'Runtime',
    kind: 'bug',
    page: 'components/lifecycle'
  },
  {
    id: 'a-detail-with-option-keys-is',
    area: 'Runtime',
    kind: 'bug',
    page: 'components/outputs'
  },
  {
    id: 'input-deletes-the-transform-of-its',
    area: 'Runtime',
    kind: 'bug',
    page: 'components/inputs'
  },
  {
    id: 'untracked-does-not-survive-a-computed',
    area: 'Signals',
    kind: 'bug',
    page: 'signals/untracked'
  },
  {
    id: 'an-unwatched-computed-signal-is-evaluated',
    area: 'Signals',
    kind: 'bug',
    page: 'signals/computed'
  },
  {
    id: 'watched-and-unwatched-fire-on-every',
    area: 'Signals',
    kind: 'bug',
    page: 'signals/options'
  },
  {
    id: 'signal-and-computed-are-not-instances',
    area: 'Signals',
    kind: 'bug',
    page: 'signals/advanced'
  },
  {
    id: 'template-errors-do-not-fail-the',
    area: 'Build',
    kind: 'bug',
    page: 'tools/build'
  },
  {
    id: 'classes-are-not-type-checked',
    area: 'Build',
    kind: 'limitation',
    page: 'tools/build'
  },
  {
    id: 'the-dev-server-keeps-stale-metadata',
    area: 'Build',
    kind: 'bug',
    page: 'tools/build'
  },
  {
    id: 'the-dev-overlay-reports-handled-errors',
    area: 'Build',
    kind: 'bug',
    page: 'signals/effects'
  },
  {
    id: 'xd-generate-does-not-exist',
    area: 'CLI',
    kind: 'bug',
    page: 'tools/cli'
  },
  {
    id: 'style-options-the-plugin-cannot-compile',
    area: 'CLI',
    kind: 'bug',
    page: 'tools/cli'
  },
  {
    id: 'the-project-name-is-checked-too',
    area: 'CLI',
    kind: 'bug',
    page: 'tools/cli'
  },
  {
    id: 'the-generated-spec-does-not-run',
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
