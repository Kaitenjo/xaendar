import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { lang } from '../../../core/router/router';
import type { ComparisonPage } from './comparison-page.type';
import type { ComparisonRate } from './comparison-rate.type';
import type { ComparisonRow } from './comparison-row.type';
import type { ComparisonTable } from './comparison-table.type';
import results from './framework-comparison.results.json';

/**
 * The "Framework comparison" page: the same page written with Angular, React and Xaendar, the way the three were
 * measured and the figures measured (`framework-comparison.results.json`, written by `comparison/measure.mjs`).
 */
@WebComponent({
  selector: 'page-reference-framework-comparison',
  styleUrl: '../../page.css',
  templateUrl: './framework-comparison.xd.component.html'
})
export class ReferenceFrameworkComparisonPage extends CustomElement {
  /**
   * The pages of the comparison, in the order of the columns of the tables: the name of the framework, its figures,
   * and the page relative to the documentation site (its folder under `src/docs/comparison`, built into
   * `public/comparison`). The file is named, since the dev server answers a folder with the documentation itself.
   */
  public readonly frameworks = [
    { label: 'Angular', figures: results.pages.angular, src: 'comparison/angular/index.html' },
    { label: 'React', figures: results.pages.react, src: 'comparison/react/index.html' },
    { label: 'Xaendar', figures: results.pages.xaendar, src: 'comparison/xaendar/index.html' }
  ] as const;

  /**
   * The browser the pages were measured in.
   */
  public readonly browser = results.browser;

  /**
   * The processor of the machine the pages were measured on.
   */
  public readonly machine = results.machine;

  /**
   * The number of runs of each page at each CPU throttling rate.
   */
  public readonly runs = results.runs;

  /**
   * The day of the measurement, in the current language.
   */
  public readonly date = computed(() => this._computeDate());

  /**
   * The tables of the results, their figures formatted in the current language.
   */
  public readonly tables = computed(() => this._computeTables());

  /**
   * The prefix of the keys of the texts of the tables in the messages.
   */
  private readonly _resultsKey = 'pages.reference.frameworkComparison.results';

  /**
   * Computes the value of `date`.
   *
   * @returns The day of the measurement, in the current language.
   */
  private _computeDate(): string {
    return new Intl.DateTimeFormat(lang(), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(results.date));
  }

  /**
   * Computes the value of `tables`.
   *
   * @returns The tables of the results: the checks that the pages do the same work, their size and memory, their
   *   times on the machine as it is and four times slower.
   */
  private _computeTables(): ComparisonTable[] {
    const integer = this._formatter(0);
    const kilobytes = this._formatter(1);
    const megabytes = this._formatter(2);
    return [
      {
        title: `${this._resultsKey}.work.title`,
        rows: [
          this._row('work.elements', figures => integer.format(figures.cpu1x.elements)),
          this._row('work.filtered', figures => integer.format(figures.cpu1x.filtered))
        ]
      },
      {
        title: `${this._resultsKey}.footprint.title`,
        rows: [
          this._row('footprint.gzip', figures => `${kilobytes.format(figures.scripts.gzip / 1000)} kB`),
          this._row('footprint.raw', figures => `${kilobytes.format(figures.scripts.raw / 1000)} kB`),
          this._row('footprint.heap', figures => `${megabytes.format(figures.cpu1x.heap / 1000000)} MB`),
          this._row('footprint.nodes', figures => integer.format(figures.cpu1x.nodes)),
          this._row('footprint.listeners', figures => integer.format(figures.cpu1x.listeners))
        ]
      },
      this._timesAt('cpu1x', integer),
      this._timesAt('cpu4x', integer)
    ];
  }

  /**
   * Builds the table of the times measured at a CPU throttling rate.
   *
   * @param rate - The CPU throttling rate.
   * @param integer - The formatter of whole numbers in the current language.
   * @returns The table: the startup, applying the filter and resetting it, in milliseconds.
   */
  private _timesAt(rate: ComparisonRate, integer: Intl.NumberFormat): ComparisonTable {
    return {
      title: `${this._resultsKey}.${rate}.title`,
      rows: [
        this._row('times.startup', figures => `${integer.format(figures[rate].startup)} ms`),
        this._row('times.filter', figures => `${integer.format(figures[rate].filter)} ms`),
        this._row('times.reset', figures => `${integer.format(figures[rate].reset)} ms`)
      ]
    };
  }

  /**
   * Builds a row of a table: one measure, read from the figures of each framework.
   *
   * @param measure - The key of the name of the measure, under the texts of the results.
   * @param read - Reads the measure from the figures of a page, formatted.
   * @returns The row.
   */
  private _row(measure: string, read: (figures: ComparisonPage) => string): ComparisonRow {
    return { label: `${this._resultsKey}.${measure}`, values: this.frameworks.map(framework => read(framework.figures)) };
  }

  /**
   * Creates a formatter of numbers in the current language, grouping the thousands also of four-digit numbers (which
   * Italian leaves ungrouped), so that the columns read alike.
   *
   * @param fractionDigits - The number of decimals written.
   * @returns The formatter.
   */
  private _formatter(fractionDigits: number): Intl.NumberFormat {
    return new Intl.NumberFormat(lang(), { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits, useGrouping: 'always' });
  }
}
