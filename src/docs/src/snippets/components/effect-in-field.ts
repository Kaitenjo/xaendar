/**
 * ✗ Created once, with the instance: disposed at the first disconnection, never created again.
 */
private readonly _sync = this.effect(() => this.save(this.value()));

/**
 * ✓ Creates the effect at every connection.
 */
public onInit(): void {
  this.effect(() => this.save(this.value()));
}
