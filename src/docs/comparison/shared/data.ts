/**
 * An employee, a row of the table.
 */
export interface Employee {
  /**
   * The unique id.
   */
  readonly id: number;
  /**
   * The full name.
   */
  readonly name: string;
  /**
   * The work address.
   */
  readonly email: string;
  /**
   * The department, one of `DEPARTMENTS`.
   */
  readonly department: string;
  /**
   * The role, one of `ROLES`.
   */
  readonly role: string;
  /**
   * The status, one of `STATUSES`.
   */
  readonly status: string;
  /**
   * The day of hiring, as `YYYY-MM-DD`.
   */
  readonly hireDate: string;
  /**
   * The yearly salary, in euros.
   */
  readonly salary: number;
}

/**
 * The criteria the table is filtered by: an empty string ignores a criterion.
 */
export interface Filters {
  /**
   * Text to find in the name or the email, ignoring case.
   */
  readonly search: string;
  /**
   * The department, or `''` for all of them.
   */
  readonly department: string;
  /**
   * The status, or `''` for all of them.
   */
  readonly status: string;
  /**
   * The first day of hiring, as `YYYY-MM-DD`, or `''`.
   */
  readonly from: string;
  /**
   * The last day of hiring, as `YYYY-MM-DD`, or `''`.
   */
  readonly to: string;
}

/**
 * An option of a select.
 */
export interface Option {
  /**
   * The value the select takes.
   */
  readonly value: string;
  /**
   * The text shown.
   */
  readonly label: string;
}

export const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Finance', 'Support', 'Legal', 'Operations'];
export const ROLES = ['Intern', 'Associate', 'Specialist', 'Senior', 'Lead', 'Manager', 'Director'];
export const STATUSES = ['Active', 'On leave', 'Remote', 'Inactive'];
export const EMPTY_FILTERS: Filters = { search: '', department: '', status: '', from: '', to: '' };
export const DEPARTMENT_OPTIONS: readonly Option[] = [{ value: '', label: 'All departments' }].concat(DEPARTMENTS.map(value => ({ value, label: value })));
export const STATUS_OPTIONS: readonly Option[] = [{ value: '', label: 'All statuses' }].concat(STATUSES.map(value => ({ value, label: value })));
export const COLUMNS = ['ID', 'Name', 'Email', 'Department', 'Role', 'Status', 'Hired', 'Salary'];

const FIRST_NAMES = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Tim', 'Frances', 'John', 'Hedy', 'Donald', 'Katherine', 'Edsger', 'Sophie', 'Guido', 'Anita', 'Bjarne'];
const LAST_NAMES = ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Perlman', 'Berners-Lee', 'Allen', 'McCarthy', 'Lamarr', 'Knuth', 'Johnson', 'Dijkstra', 'Wilson', 'van Rossum', 'Borg', 'Stroustrup'];

/**
 * A deterministic pseudo-random sequence, so that the three pages show the same rows.
 */
function createRandom(seed: number): (max: number) => number {
  let state = seed;
  return max => {
    state = (state * 16807) % 2147483647;
    return state % max;
  };
}

/**
 * Builds the rows of the table, the same on every page.
 *
 * @param count - How many rows.
 * @returns The rows.
 */
export function createEmployees(count = 1000): Employee[] {
  const random = createRandom(42);
  const employees = new Array<Employee>(count);
  const start = Date.UTC(2015, 0, 1);
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[random(FIRST_NAMES.length)]!;
    const last = LAST_NAMES[random(LAST_NAMES.length)]!;
    const day = new Date(start + random(3650) * 86400000).toISOString().slice(0, 10);
    employees[i] = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase().replaceAll(' ', ''),
      department: DEPARTMENTS[random(DEPARTMENTS.length)]!,
      role: ROLES[random(ROLES.length)]!,
      status: STATUSES[random(STATUSES.length)]!,
      hireDate: day,
      salary: 28000 + random(120) * 1000
    };
  }

  return employees;
}

/**
 * Keeps the rows matching every criterion.
 *
 * @param employees - The rows.
 * @param filters - The criteria.
 * @returns The rows to show.
 */
export function filterEmployees(employees: readonly Employee[], filters: Filters): Employee[] {
  const search = filters.search.trim().toLowerCase();
  return employees.filter(employee =>
    (!search || employee.name.toLowerCase().includes(search) || employee.email.includes(search))
    && (!filters.department || employee.department === filters.department)
    && (!filters.status || employee.status === filters.status)
    && (!filters.from || employee.hireDate >= filters.from)
    && (!filters.to || employee.hireDate <= filters.to));
}

const SALARY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' });

/**
 * Formats a salary.
 *
 * @param salary - The amount.
 * @returns The text, as `€45,000`.
 */
export function formatSalary(salary: number): string {
  return SALARY.format(salary);
}

/**
 * Formats a day.
 *
 * @param day - The day, as `YYYY-MM-DD`.
 * @returns The text, as `Mar 04, 2019`.
 */
export function formatDate(day: string): string {
  return DATE.format(new Date(`${day}T00:00:00Z`));
}

/**
 * Gives the class of the badge of a status.
 *
 * @param status - The status.
 * @returns The class, as `badge badge--active`.
 */
export function statusClass(status: string): string {
  return `badge badge--${status.toLowerCase().replaceAll(' ', '-')}`;
}
