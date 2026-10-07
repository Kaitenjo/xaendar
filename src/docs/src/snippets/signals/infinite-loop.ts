// ✗ The effect reads count and writes it: every run schedules another one, forever.
//   The microtask queue never empties and the page freezes.
this.effect(() => {
  this.count.set(this.count() + 1);
});

// ✓ update() reads the previous value without tracking it: the effect does not depend on count.
this.effect(() => {
  this.log.update(log => [...log, `seen ${this.other()}`]);
});
