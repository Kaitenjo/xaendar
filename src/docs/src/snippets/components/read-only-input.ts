public reset(): void {
  this.count.set(0);
  // ✗ Property 'set' does not exist on type 'InputSignal<number>'.
  // Forced with a cast, the call throws: Invalid symbol for InputSignal set method
}
