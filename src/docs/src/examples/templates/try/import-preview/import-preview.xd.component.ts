import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A person read from a row of an import.
 */
type Person = {
  /**
   * The name of the person.
   */
  readonly name: string;
  /**
   * The age of the person.
   */
  readonly age: number;
};

/**
 * Previews the rows of an import, each one parsed in a `@try`: a broken row shows its `@catch`, and the others are not
 * affected. A row added is a new item of the `@for`, so its `@try` is rendered for the first time.
 */
@WebComponent({
  selector: 'ex-import-preview',
  styleUrl: './import-preview.css',
  templateUrl: './import-preview.xd.component.html'
})
export class ImportPreviewComponent extends CustomElement {
  /**
   * The rows of the import, as JSON.
   */
  public readonly rows = signal(['{"name":"Ada","age":36}', '{"name":"Linus",', '{"name":"Grace","age":85}']);

  /**
   * Parses a row.
   *
   * @param row - The row, as JSON.
   * @returns The person of the row.
   * @throws When the row is not valid JSON.
   */
  public parse(row: string): Person {
    return JSON.parse(row) as Person;
  }

  /**
   * Adds a valid row.
   */
  public addRow(): void {
    this.rows.update(rows => rows.concat('{"name":"Alan","age":41}'));
  }

  /**
   * Adds a broken row.
   */
  public addBrokenRow(): void {
    this.rows.update(rows => rows.concat('{"name":'));
  }
}
