/**
 * The directive applied to the first element the selector finds that has it.
 */
@Query('.help', { read: TooltipDirective })
public accessor helpTooltip!: QuerySignal<TooltipDirective | null>;
/**
 * The element a directive is applied to, typed by the type argument.
 */
@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })
public accessor withTooltip!: QuerySignal<HTMLButtonElement | null>;
/**
 * The directive applied to the element an element ref names.
 */
@Query.ref.required('field', { read: TooltipDirective })
public accessor fieldTooltip!: QuerySignal<TooltipDirective>;
/**
 * Together with the options of the slots.
 */
@Query.content('.tab', { slots: 'header', read: TooltipDirective })
public accessor tabTooltip!: QuerySignal<TooltipDirective | null>;
/**
 * Not on the .all variants: TypeScript rejects the option.
 */
@Query.all('.help', { read: TooltipDirective })
public accessor tooltips!: QuerySignal<TooltipDirective[]>;
