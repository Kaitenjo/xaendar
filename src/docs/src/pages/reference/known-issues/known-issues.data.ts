/**
 * The kinds of known issues.
 */
export type IssueKind = 'bug' | 'limitation' | 'docs';

/**
 * The texts of an issue, in one language, under its id in the `issues` texts. They are typed here
 * rather than derived from those texts, which are empty when there is no known issue.
 */
export type IssueTexts = {
  /**
   * The name of the issue.
   */
  readonly title: string;
  /**
   * What happens, and when.
   */
  readonly details: string;
  /**
   * The way around it.
   */
  readonly workaround: string;
};

/**
 * A problem of the framework or of its tools, as found while writing this site.
 */
export type IssueEntry = {
  /**
   * The key of the texts of the issue (title, details and workaround) in the `issues` texts.
   */
  readonly id: string;
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
export const ISSUES: readonly IssueEntry[] = [];
