import { CustomElement, query, queryAll } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';

export class ListComponent extends CustomElement {
  // The same as @Query and @Query.all, created in a field
  public readonly field = query<string, HTMLInputElement>(this, 'input');
  public readonly rows = queryAll(this, '.row');

  // In an attribute binding, read them through a computed signal: see the edge cases
  public readonly rowCount = computed(() => this.rows().length);
}
