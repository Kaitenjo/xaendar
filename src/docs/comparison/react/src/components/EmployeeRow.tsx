import { memo } from 'react';
import { type Employee, formatDate, formatSalary, statusClass } from '../../../shared/data';

/**
 * A row of the table, rendered again only when its employee or its selection changes (`memo`): selecting a row renders
 * the two rows whose selection changed, not the 1,000.
 */
export const EmployeeRow = memo(function EmployeeRow({ employee, selected, onSelect }: { employee: Employee; selected: boolean; onSelect: (id: number) => void }) {
  return (
    <tr className={selected ? 'row--selected' : undefined} onClick={() => onSelect(employee.id)}>
      <td className="cell--muted">{employee.id}</td>
      <td>{employee.name}</td>
      <td className="cell--muted">{employee.email}</td>
      <td>{employee.department}</td>
      <td>{employee.role}</td>
      <td><span className={statusClass(employee.status)}>{employee.status}</span></td>
      <td>{formatDate(employee.hireDate)}</td>
      <td className="cell--number">{formatSalary(employee.salary)}</td>
    </tr>
  );
});
