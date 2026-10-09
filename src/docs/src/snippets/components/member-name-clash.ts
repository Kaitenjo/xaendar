/**
 * ✗ Property 'remove' in type 'TodoItemComponent' is not assignable to the same property in base type 'CustomElement'.
 * ✗ Class 'CustomElement' defines instance member function 'remove', but extended class 'TodoItemComponent'
 *   defines it as instance member accessor.
 */
@Event()
public accessor remove!: Output<number>;

/**
 * ✗ Property 'title' in type 'ProfileComponent' is not assignable to the same property in base type 'CustomElement'.
 */
public readonly title = signal('Dr.');

/**
 * ✓ A name that HTMLElement does not use.
 */
@Event()
public accessor removed!: Output<number>;

/**
 * ✓ Another name for the member: templates still bind lang="…".
 */
@Property('ts', { alias: 'lang' })
public accessor language!: InputSignal<string>;
