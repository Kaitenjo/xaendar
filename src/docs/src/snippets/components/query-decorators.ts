/**
 * The first match, or null.
 */
@Query('input')
public accessor field!: QuerySignal<HTMLElement | null>;
/**
 * The type argument narrows the element.
 */
@Query<HTMLInputElement>('input[type=search]')
public accessor search!: QuerySignal<HTMLInputElement | null>;
/**
 * A component class: its selector, typed as its instance.
 */
@Query(CounterBadgeComponent)
public accessor badge!: QuerySignal<CounterBadgeComponent | null>;
/**
 * Every match, in document order: [] when there is none.
 */
@Query.all('.row')
public accessor rows!: QuerySignal<HTMLElement[]>;
