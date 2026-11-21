import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { COLUMNS, createEmployees, DEPARTMENT_OPTIONS, EMPTY_FILTERS, filterEmployees, formatDate, formatSalary, STATUS_OPTIONS, statusClass, type Filters } from '../../../shared/data';
import { UiButton } from './ui-button';
import { UiDateInput } from './ui-date-input';
import { UiSelect } from './ui-select';
import { UiTextInput } from './ui-text-input';

/**
 * The page: the filters, edited as a draft and applied on demand, and the table of the employees.
 */
@Component({
  selector: 'employees-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiDateInput, UiSelect, UiTextInput],
  template: `
    <main class="page">
      <header class="page__header">
        <h1 class="page__title">Employees</h1>
        <span class="page__framework">Angular</span>
      </header>
      <div class="filters">
        <ui-text-input label="Search" placeholder="Name or email" [(value)]="search" />
        <ui-select label="Department" [options]="departments" [(value)]="department" />
        <ui-select label="Status" [options]="statuses" [(value)]="status" />
        <ui-date-input label="Hired from" [(value)]="from" />
        <ui-date-input label="Hired to" [(value)]="to" />
        <div class="filters__actions">
          <ui-button variant="primary" (click)="apply()">Apply</ui-button>
          <ui-button (click)="clearFilters()">Reset</ui-button>
        </div>
      </div>
      <p class="summary">Showing {{ rows().length }} of {{ employees.length }} employees</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              @for (column of columns; track column) {
                <th>{{ column }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (employee of rows(); track employee.id) {
              <tr>
                <td class="cell--muted">{{ employee.id }}</td>
                <td>{{ employee.name }}</td>
                <td class="cell--muted">{{ employee.email }}</td>
                <td>{{ employee.department }}</td>
                <td>{{ employee.role }}</td>
                <td><span [class]="badge(employee.status)">{{ employee.status }}</span></td>
                <td>{{ day(employee.hireDate) }}</td>
                <td class="cell--number">{{ money(employee.salary) }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (rows().length === 0) {
          <p class="empty">No employee matches the filters.</p>
        }
      </div>
    </main>
  `
})
export class EmployeesPage {
  protected readonly columns = COLUMNS;
  protected readonly departments = DEPARTMENT_OPTIONS;
  protected readonly statuses = STATUS_OPTIONS;
  protected readonly employees = createEmployees();
  protected readonly search = signal('');
  protected readonly department = signal('');
  protected readonly status = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly applied = signal<Filters>(EMPTY_FILTERS);
  protected readonly rows = computed(() => filterEmployees(this.employees, this.applied()));

  /**
   * Filters the table by the draft.
   */
  protected apply(): void {
    this.applied.set({ search: this.search(), department: this.department(), status: this.status(), from: this.from(), to: this.to() });
  }

  /**
   * Empties the filters and shows every employee.
   */
  protected clearFilters(): void {
    this.search.set('');
    this.department.set('');
    this.status.set('');
    this.from.set('');
    this.to.set('');
    this.applied.set(EMPTY_FILTERS);
  }

  protected badge(status: string): string {
    return statusClass(status);
  }

  protected day(day: string): string {
    return formatDate(day);
  }

  protected money(salary: number): string {
    return formatSalary(salary);
  }
}
