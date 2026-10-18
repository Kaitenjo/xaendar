/**
 * The first element with the header attribute, in any slot.
 */
@Query.content('[header]')
public accessor header!: QuerySignal<HTMLElement | null>;
/**
 * The buttons assigned to the footer slot, or inside the elements assigned to it.
 */
@Query.content.all<HTMLButtonElement>('button', { slots: 'footer' })
public accessor actions!: QuerySignal<HTMLButtonElement[]>;
/**
 * The items of the default slot and of the aside slot.
 */
@Query.content.all('[item]', { slots: ['', 'aside'] })
public accessor items!: QuerySignal<HTMLElement[]>;
/**
 * Every item in the light DOM of the element, assigned to a slot or not.
 */
@Query.content.all('[item]', { lightDom: true })
public accessor allItems!: QuerySignal<HTMLElement[]>;
/**
 * ✗ slots and lightDom cannot be combined: TypeScript rejects the options.
 */
@Query.content.all('[item]', { slots: 'aside', lightDom: true })
public accessor mixed!: QuerySignal<HTMLElement[]>;
