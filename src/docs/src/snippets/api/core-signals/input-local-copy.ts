/**
 * The value bound by the parent.
 */
@Property(0)
public accessor value!: InputSignal<number>;
/**
 * The value shown, which the component changes too.
 */
public readonly current = signal(0);

/**
 * Copies every value the parent binds into the local signal.
 */
public onInit(): void {
  this.effect(() => this.current.set(this.value()));
}

/**
 * Changes the local value: the input keeps the one of the parent.
 */
public increment(): void {
  this.current.update(current => current + 1);
}
