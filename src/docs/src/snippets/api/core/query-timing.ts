/**
 * The field of the editor, rendered by an @if only while editing.
 */
@Query<HTMLInputElement>('input')
public accessor field!: QuerySignal<HTMLInputElement | null>;

/**
 * Before the render: the query is still empty.
 */
public onInit(): void {
  console.log(this.field()); // null
  // Runs again when the query is filled, and each time the field appears or disappears
  this.effect(() => {
    this.field()?.focus();
  });
}

/**
 * After the render: the query holds the field, if the template renders it.
 */
public afterRender(): void {
  console.log(this.field());
}
