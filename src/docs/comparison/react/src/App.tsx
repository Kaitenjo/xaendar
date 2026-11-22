import { useCallback, useMemo, useState } from 'react';
import { createEmployees, DEPARTMENT_OPTIONS, EMPTY_FILTERS, type Filters, filterEmployees, raiseSalaries, STATUS_OPTIONS } from '../../shared/data';
import { Button } from './components/Button';
import { DateInput } from './components/DateInput';
import { EmployeeTable } from './components/EmployeeTable';
import { SelectInput } from './components/SelectInput';
import { TextInput } from './components/TextInput';

const EMPLOYEES = createEmployees();

/**
 * Gives a callback writing one criterion of the draft.
 *
 * @param setDraft - The setter of the draft.
 * @param key - The criterion.
 * @returns The callback, receiving the new value.
 */
function editor(setDraft: (update: (current: Filters) => Filters) => void, key: keyof Filters): (value: string) => void {
  return value => setDraft(current => ({ ...current, [key]: value }));
}

/**
 * The page: the filters, edited as a draft and applied on demand, and the table of the employees, whose rows can be
 * selected and whose salaries can be raised.
 *
 * Written with the optimizations React offers, so that an update renders only what it changes: the components are
 * memoized (`memo`), their callbacks keep their identity across renders (`useCallback`, `useMemo`, the setters of
 * `useState`), and the rows are computed again only when the data or the applied filters change (`useMemo`).
 */
export function App() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [employees, setEmployees] = useState(EMPLOYEES);
  const [selected, setSelected] = useState<number | null>(null);
  const rows = useMemo(() => filterEmployees(employees, applied), [employees, applied]);
  const edit = useMemo(() => ({
    search: editor(setDraft, 'search'),
    department: editor(setDraft, 'department'),
    status: editor(setDraft, 'status'),
    from: editor(setDraft, 'from'),
    to: editor(setDraft, 'to')
  }), []);
  const apply = useCallback(() => setApplied(draft), [draft]);
  const reset = useCallback(() => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }, []);
  const raise = useCallback(() => setEmployees(current => raiseSalaries(current)), []);

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Employees</h1>
        <span className="page__framework">React</span>
      </header>
      <div className="filters">
        <TextInput label="Search" placeholder="Name or email" value={draft.search} onChange={edit.search} />
        <SelectInput label="Department" options={DEPARTMENT_OPTIONS} value={draft.department} onChange={edit.department} />
        <SelectInput label="Status" options={STATUS_OPTIONS} value={draft.status} onChange={edit.status} />
        <DateInput label="Hired from" value={draft.from} onChange={edit.from} />
        <DateInput label="Hired to" value={draft.to} onChange={edit.to} />
        <div className="filters__actions">
          <Button variant="primary" onClick={apply}>Apply</Button>
          <Button onClick={reset}>Reset</Button>
          <Button onClick={raise}>Raise 5%</Button>
        </div>
      </div>
      <p className="summary">Showing {rows.length} of {employees.length} employees</p>
      <EmployeeTable rows={rows} selected={selected} onSelect={setSelected} />
    </main>
  );
}
