// ✗ created once, with the instance: disposed at the first disconnection, never created again
private readonly sync = this.effect(() => this.save(this.value()));

// ✓ created at every connection
public onInit(): void {
  this.effect(() => this.save(this.value()));
}
