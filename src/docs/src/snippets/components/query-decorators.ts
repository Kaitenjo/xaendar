@Query('input')                                   // the first match, or null
public accessor field!: QuerySignal<HTMLElement | null>;

@Query<HTMLInputElement>('input[type=search]')    // the type argument narrows the element
public accessor search!: QuerySignal<HTMLInputElement | null>;

@Query(CounterBadgeComponent)                     // a component class: its selector, typed as its instance
public accessor badge!: QuerySignal<CounterBadgeComponent | null>;

@Query.all('.row')                                // every match, in document order: [] when there is none
public accessor rows!: QuerySignal<HTMLElement[]>;
