import { memo } from 'react';
import { COLUMNS, type Employee } from '../../../shared/data';
import { EmployeeRow } from './EmployeeRow';

/**
 * The table of the employees, rendered again only when its rows or the selection change (`memo`): editing the filters
 * leaves it alone until they are applied.
 */
export const EmployeeTable = memo(function EmployeeTable({ rows, selected, onSelect }: { rows: readonly Employee[]; selected: number | null; onSelect: (id: number) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(employee => <EmployeeRow key={employee.id} employee={employee} selected={employee.id === selected} onSelect={onSelect} />)}
        </tbody>
      </table>
      {rows.length ? null : <p className="empty">No employee matches the filters.</p>}
    </div>
  );
});
