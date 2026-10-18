/**
 * The first element marked as header, among the elements assigned to any slot and their descendants.
 */
@Query.content('[header]')
public accessor header!: QuerySignal<HTMLElement | null>;
/**
 * The buttons assigned to the footer slot, and the ones inside them.
 */
@Query.content.all('button', { slots: 'footer' })
public accessor actions!: QuerySignal<HTMLElement[]>;
/**
 * The items of the default slot and of the aside slot: '' is the default slot.
 */
@Query.content.all('.item', { slots: ['', 'aside'] })
public accessor items!: QuerySignal<HTMLElement[]>;
/**
 * Every item among the descendants of the element, assigned to a slot or not, in document order.
 */
@Query.content.all('.item', { lightDom: true })
public accessor allItems!: QuerySignal<HTMLElement[]>;
/**
 * ✗ slots and lightDom: true exclude each other: the options do not compile.
 */
@Query.content.all('.item', { slots: 'aside', lightDom: true })
public accessor mixed!: QuerySignal<HTMLElement[]>;
