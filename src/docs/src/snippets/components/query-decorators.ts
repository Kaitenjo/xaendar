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
/**
 * A directive class: the instances applied to the elements, not the elements.
 */
@Query.all(TooltipDirective)
public accessor tooltips!: QuerySignal<TooltipDirective[]>;
/**
 * An element ref of the template, #field: no selector involved.
 */
@Query.ref<HTMLInputElement>('field')
public accessor input!: QuerySignal<HTMLInputElement | null>;
