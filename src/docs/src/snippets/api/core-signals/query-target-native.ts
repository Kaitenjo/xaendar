/**
 * ✗ A native class is not a component: it has no selector.
 */
@Query(HTMLInputElement)
public accessor field!: QuerySignal<HTMLInputElement | null>;
// It compiles, but creating the component throws:
// Error: HTMLInputElement does not seem to be decorated with @WebComponent

/**
 * ✓ A tag name, with the type of the element as type argument.
 */
@Query<HTMLInputElement>('input')
public accessor field!: QuerySignal<HTMLInputElement | null>;
