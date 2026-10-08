// The usual immutable update creates a new object with the same id...
this.items.update(items => items.map(item => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));

// ...but with `track item.id` the row already rendered for that id is kept, and keeps showing the old object.
// Either keep the changing fields in signals, as the inventory does with quantity, or track by identity:
//   @for (item of items(); track item) { … }   the replaced object gets a new row
