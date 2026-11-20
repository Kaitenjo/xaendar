import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { COLUMNS, createEmployees, DEPARTMENT_OPTIONS, type Employee, EMPTY_FILTERS, type Filters, filterEmployees, formatDate, formatSalary, STATUS_OPTIONS, statusClass } from '../../../shared/data';

/**
 * The page: the filters, edited as a draft and applied on demand, and the table of the employees.
 */
@WebComponent({
  selector: 'employees-page',
  styleUrl: '../../../shared/page.css',
  templateUrl: './employees-page.xd.component.html'
})
export class EmployeesPageComponent extends CustomElement {
  public readonly columns = COLUMNS;
  public readonly departments = DEPARTMENT_OPTIONS;
  public readonly statuses = STATUS_OPTIONS;
  public readonly employees = createEmployees();
  public readonly search = signal('');
  public readonly department = signal('');
  public readonly status = signal('');
  public readonly from = signal('');
  public readonly to = signal('');
  public readonly applied = signal<Filters>(EMPTY_FILTERS);
  public readonly rows = computed(() => this._computeRows());

  /**
   * Filters the table by the draft.
   */
  public apply(): void {
    this.applied.set({ search: this.search(), department: this.department(), status: this.status(), from: this.from(), to: this.to() });
  }

  /**
   * Empties the filters and shows every employee.
   */
  public clearFilters(): void {
    this.search.set('');
    this.department.set('');
    this.status.set('');
    this.from.set('');
    this.to.set('');
    this.applied.set(EMPTY_FILTERS);
  }

  /**
   * The class of the badge of a status.
   */
  public badge(status: string): string {
    return statusClass(status);
  }

  /**
   * Formats a day.
   */
  public day(day: string): string {
    return formatDate(day);
  }

  /**
   * Formats a salary.
   */
  public money(salary: number): string {
    return formatSalary(salary);
  }

  /**
   * Computes the value of `rows`.
   */
  private _computeRows(): Employee[] {
    return filterEmployees(this.employees, this.applied());
  }
}
