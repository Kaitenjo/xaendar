/**
 * A template declared by `<template name(…)>` in the template of a component, as a value: the template reads the
 * variables of the scope declaring it and the members of the component declaring it, wherever it is rendered. It is
 * passed to another component as the value of an input (`rowTemplate="{row}"`), or as content, read by
 * `@Query.contentTemplate`, and rendered by a `@render` calling it (`@render rowTemplate()(item)`), with the arguments
 * of its parameters, as `ngTemplateOutlet` of Angular with its context.
 *
 * Only a template creates it: the type tells the parameters of the template, as a labeled tuple, and nothing else of it
 * can be read.
 *
 * @template Params - The parameters of the template, e.g. `[item: Item, index: number]`.
 *
 * @example
 * ```ts
 * \@Property<InputSignal<TemplateRef<[item: Item]> | null>>(null)
 * public accessor rowTemplate!: InputSignal<TemplateRef<[item: Item]> | null>;
 * ```
 */
export type TemplateRef<Params extends unknown[] = []> = {
  /**
   * The function the content of the template stands for, taking the parameters of the template: it exists only in the
   * types, so that a template accepting the arguments of a `@render` is accepted where it renders.
   */
  readonly __template: (...params: Params) => void;
};
