/**
 * The rows rendered by the @for of the template.
 */
@Query.all('.row')
public accessor rows!: QuerySignal<HTMLElement[]>;
/**
 * How many rows are shown: a computed signal reading the query follows it.
 */
public readonly count = computed(() => this._computeCount());

/**
 * Logs the rows whenever they change. The first run, before the render, sees an empty list.
 */
public onInit(): void {
  this.effect(() => console.log(this.rows().length));
}

/**
 * The rows are there: the query was filled right after the render.
 */
public afterRender(): void {
  this.rows()[0]?.focus();
}

/**
 * Computes the value of `count`.
 *
 * @returns The number of rows.
 */
private _computeCount(): number {
  return this.rows().length;
}
