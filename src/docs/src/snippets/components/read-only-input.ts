public reset(): void {
  this.count.set(0);
  // ✗ Property 'set' does not exist on type 'InputSignal<number>'.
}
