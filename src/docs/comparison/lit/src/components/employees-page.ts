import { html, LitElement, nothing, type PropertyValues, unsafeCSS } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { COLUMNS, createEmployees, DEPARTMENT_OPTIONS, type Employee, EMPTY_FILTERS, filterEmployees, type Filters, formatDate, formatSalary, raiseSalaries, STATUS_OPTIONS, statusClass } from '../../../shared/data';
import styles from '../../../shared/page.css?inline';
import './ui-button';
import './ui-date-input';
import './ui-select';
import './ui-text-input';

/**
 * The page: the filters, edited as a draft and applied on demand, and the table of the employees, whose rows can be
 * selected and whose salaries can be raised.
 *
 * Written with what Lit offers so that an update writes only what changed: every update renders the template again,
 * but Lit writes to the page only the bindings whose value differs from the previous one; the rows are keyed by the
 * id (`repeat`), and computed again only when the data or the applied filters change (`willUpdate`).
 */
export class EmployeesPage extends LitElement {
  public static override styles = unsafeCSS(styles);
  public static override properties = {
    employees: { state: true },
    selected: { state: true },
    draft: { state: true },
    applied: { state: true }
  };

  /**
   * Every employee.
   */
  declare public employees: readonly Employee[];
  /**
   * The id of the selected row.
   */
  declare public selected: number | null;
  /**
   * The filters being edited.
   */
  declare public draft: Filters;
  /**
   * The filters applied to the table.
   */
  declare public applied: Filters;
  /**
   * The rows shown, the employees the applied filters keep.
   */
  private _rows: readonly Employee[] = [];
  /**
   * The listeners writing each criterion of the draft, created once so that they keep their identity across updates.
   */
  private readonly _editors = {
    search: this._edit('search'),
    department: this._edit('department'),
    status: this._edit('status'),
    from: this._edit('from'),
    to: this._edit('to')
  };

  public constructor() {
    super();
    this.employees = createEmployees();
    this.selected = null;
    this.draft = EMPTY_FILTERS;
    this.applied = EMPTY_FILTERS;
  }

  /**
   * Filters the table by the draft.
   */
  public apply(): void {
    this.applied = this.draft;
  }

  /**
   * Empties the filters and shows every employee.
   */
  public clearFilters(): void {
    this.draft = EMPTY_FILTERS;
    this.applied = EMPTY_FILTERS;
  }

  /**
   * Raises every salary by 5%.
   */
  public raise(): void {
    this.employees = raiseSalaries(this.employees);
  }

  /**
   * Computes the rows again when the data or the applied filters changed.
   *
   * @param changed - The properties changed since the previous update.
   */
  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('employees') || changed.has('applied')) {
      this._rows = filterEmployees(this.employees, this.applied);
    }
  }

  protected override render() {
    const rows = this._rows;
    return html`
      <main class="page">
        <header class="page__header">
          <h1 class="page__title">Employees</h1>
          <span class="page__framework">Lit</span>
        </header>
        <div class="filters">
          <ui-text-input label="Search" placeholder="Name or email" .value=${this.draft.search} @value-change=${this._editors.search}></ui-text-input>
          <ui-select label="Department" .options=${DEPARTMENT_OPTIONS} .value=${this.draft.department} @value-change=${this._editors.department}></ui-select>
          <ui-select label="Status" .options=${STATUS_OPTIONS} .value=${this.draft.status} @value-change=${this._editors.status}></ui-select>
          <ui-date-input label="Hired from" .value=${this.draft.from} @value-change=${this._editors.from}></ui-date-input>
          <ui-date-input label="Hired to" .value=${this.draft.to} @value-change=${this._editors.to}></ui-date-input>
          <div class="filters__actions">
            <ui-button variant="primary" @click=${this.apply}>Apply</ui-button>
            <ui-button @click=${this.clearFilters}>Reset</ui-button>
            <ui-button @click=${this.raise}>Raise 5%</ui-button>
          </div>
        </div>
        <p class="summary">Showing ${rows.length} of ${this.employees.length} employees</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>${COLUMNS.map(column => html`<th>${column}</th>`)}</tr>
            </thead>
            <tbody>
              ${repeat(rows, employee => employee.id, employee => html`
                <tr class=${employee.id === this.selected ? 'row--selected' : nothing} @click=${() => this.selected = employee.id}>
                  <td class="cell--muted">${employee.id}</td>
                  <td>${employee.name}</td>
                  <td class="cell--muted">${employee.email}</td>
                  <td>${employee.department}</td>
                  <td>${employee.role}</td>
                  <td><span class=${statusClass(employee.status)}>${employee.status}</span></td>
                  <td>${formatDate(employee.hireDate)}</td>
                  <td class="cell--number">${formatSalary(employee.salary)}</td>
                </tr>
              `)}
            </tbody>
          </table>
          ${rows.length ? nothing : html`<p class="empty">No employee matches the filters.</p>`}
        </div>
      </main>
    `;
  }

  /**
   * Gives the listener writing one criterion of the draft, from the `value-change` event of its field.
   *
   * @param key - The criterion.
   * @returns The listener.
   */
  private _edit(key: keyof Filters): (event: CustomEvent<string>) => void {
    return event => this.draft = { ...this.draft, [key]: event.detail };
  }
}

customElements.define('employees-page', EmployeesPage);
