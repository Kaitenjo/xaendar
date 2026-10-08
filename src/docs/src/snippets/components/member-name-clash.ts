@Event()
public accessor remove!: Output<number>;
// ✗ Property 'remove' in type 'TodoItemComponent' is not assignable to the same property in base type 'CustomElement'.
// ✗ Class 'CustomElement' defines instance member function 'remove', but extended class 'TodoItemComponent'
//   defines it as instance member accessor.

public readonly title = signal('Dr.');
// ✗ Property 'title' in type 'ProfileComponent' is not assignable to the same property in base type 'CustomElement'.

@Event()
public accessor removed!: Output<number>;      // ✓

@Property('ts', { alias: 'lang' })             // ✓ templates still bind lang="…"
public accessor language!: InputSignal<string>;
