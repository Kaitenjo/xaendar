import type { CreateComponentOptions, CustomDirective, CustomElement } from '@xaendar/core';

/**
 * The inputs of a component, by the name the templates bind them with, each one with the getter `createComponent` binds it with.
 *
 * @template Component - The component.
 */
export type InputGetters<Component extends CustomElement | CustomDirective> = Omit<NonNullable<CreateComponentOptions<Component>['properties']>[number], 'condition'>;
