import { useMemo, useState } from 'react';
import { COLUMNS, createEmployees, DEPARTMENT_OPTIONS, EMPTY_FILTERS, type Filters, filterEmployees, formatDate, formatSalary, raiseSalaries, STATUS_OPTIONS, statusClass } from '../../shared/data';
import { Button } from './components/Button';
import { DateInput } from './components/DateInput';
import { SelectInput } from './components/SelectInput';
import { TextInput } from './components/TextInput';

const EMPLOYEES = createEmployees();

/**
 * The page: the filters, edited as a draft and applied on demand, and the table of the employees, whose rows can be
 * selected and whose salaries can be raised.
 */
export function App() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [employees, setEmployees] = useState(EMPLOYEES);
  const [selected, setSelected] = useState<number | null>(null);
  const rows = useMemo(() => filterEmployees(employees, applied), [employees, applied]);
  const edit = (key: keyof Filters) => (value: string) => setDraft(current => ({ ...current, [key]: value }));
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Employees</h1>
        <span className="page__framework">React</span>
      </header>
      <div className="filters">
        <TextInput label="Search" placeholder="Name or email" value={draft.search} onChange={edit('search')} />
        <SelectInput label="Department" options={DEPARTMENT_OPTIONS} value={draft.department} onChange={edit('department')} />
        <SelectInput label="Status" options={STATUS_OPTIONS} value={draft.status} onChange={edit('status')} />
        <DateInput label="Hired from" value={draft.from} onChange={edit('from')} />
        <DateInput label="Hired to" value={draft.to} onChange={edit('to')} />
        <div className="filters__actions">
          <Button variant="primary" onClick={() => setApplied(draft)}>Apply</Button>
          <Button onClick={reset}>Reset</Button>
          <Button onClick={() => setEmployees(current => raiseSalaries(current))}>Raise 5%</Button>
        </div>
      </div>
      <p className="summary">Showing {rows.length} of {employees.length} employees</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(employee => (
              <tr key={employee.id} className={employee.id === selected ? 'row--selected' : undefined} onClick={() => setSelected(employee.id)}>
                <td className="cell--muted">{employee.id}</td>
                <td>{employee.name}</td>
                <td className="cell--muted">{employee.email}</td>
                <td>{employee.department}</td>
                <td>{employee.role}</td>
                <td><span className={statusClass(employee.status)}>{employee.status}</span></td>
                <td>{formatDate(employee.hireDate)}</td>
                <td className="cell--number">{formatSalary(employee.salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length ? null : <p className="empty">No employee matches the filters.</p>}
      </div>
    </main>
  );
}
