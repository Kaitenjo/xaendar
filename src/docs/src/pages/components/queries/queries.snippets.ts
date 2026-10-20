import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `query-decorators.ts`, shown by the page components/queries and the API reference of core-signals and the API reference of core.
 */
export const QUERY_DECORATORS: SourceFile = {
  name: 'query-decorators.ts',
  lang: 'ts',
  code: `/**
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
public accessor input!: QuerySignal<HTMLInputElement | null>;`
};

/**
 * The snippet `query-required.ts`, shown by the page components/queries and the API reference of core-signals and the API reference of core.
 */
export const QUERY_REQUIRED: SourceFile = {
  name: 'query-required.ts',
  lang: 'ts',
  code: `/**
 * Always in the template: no null, and reading it throws when it is missing.
 */
@Query.required<HTMLInputElement>('input[type=search]')
public accessor search!: QuerySignal<HTMLInputElement>;

public afterRender(): void {
  this.search().focus();
}`
};
