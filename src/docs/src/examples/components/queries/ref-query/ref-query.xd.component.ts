import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { MarkDirective } from './mark.directive';

/**
 * Finds elements of its own template by their element refs, and the directives applied to them by their class.
 */
@WebComponent({
  selector: 'ex-ref-query',
  styleUrl: './ref-query.css',
  templateUrl: './ref-query.xd.component.html'
})
export class RefQueryComponent extends CustomElement {
  /**
   * The text field, named by the ref #field.
   */
  @Query.ref.required<HTMLInputElement>('field')
  public accessor field!: QuerySignal<HTMLInputElement>;
  /**
   * The rows, named by the ref #row in every row of the @for.
   */
  @Query.ref.all<HTMLLIElement>('row')
  public accessor rows!: QuerySignal<HTMLLIElement[]>;
  /**
   * The directives applied to the rows: the instances, not the elements.
   */
  @Query.all(MarkDirective)
  public accessor marks!: QuerySignal<MarkDirective[]>;
  /**
   * The texts of the list.
   */
  public readonly items = signal(['Signals', 'Components']);
  /**
   * How many rows are marked.
   */
  public readonly marked = computed(() => this._computeMarked());

  /**
   * Adds the text of the field to the list.
   */
  public add(): void {
    const field = this.field();
    const value = field.value.trim();
    if (value) {
      this.items.update(items => items.concat(value));
      field.value = '';
    }
  }

  /**
   * Marks every row, or removes its mark, through the directive applied to it.
   */
  public toggleAll(): void {
    const marks = this.marks();
    for (let i = 0; i < marks.length; i++) {
      marks[i].toggle();
    }
  }

  /**
   * Computes the value of `marked`.
   *
   * @returns How many rows are marked.
   */
  private _computeMarked(): number {
    return this.marks().filter(mark => mark.marked()).length;
  }
}
