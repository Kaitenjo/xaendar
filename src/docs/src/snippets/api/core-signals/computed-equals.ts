/**
 * The names of the tasks done. Every evaluation returns a new array: compared by content, a change that leaves the
 * same names notifies nobody.
 */
public readonly doneNames = computed(() => this._computeDoneNames(), {
  equals: (current: string[], next: string[]) =>
    current.length === next.length && current.every((name, index) => name === next[index])
});

/**
 * Computes the value of `doneNames`.
 *
 * @returns The names of the tasks done, in order.
 */
private _computeDoneNames(): string[] {
  return this.tasks().filter(task => task.done).map(task => task.name);
}
