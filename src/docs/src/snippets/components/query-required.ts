/**
 * Always in the template: no null, and reading it throws when it is missing.
 */
@Query.required<HTMLInputElement>('input[type=search]')
public accessor search!: QuerySignal<HTMLInputElement>;

public afterRender(): void {
  this.search().focus();
}
