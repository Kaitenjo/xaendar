import type { CreateComponentOptions } from '@xaendar/core';

/**
 * The inputs of a component, by the name of their property, each one with the getter `createComponent` binds it with.
 *
 * @template Component - The component.
 */
export type InputGetters<Component> = Omit<NonNullable<CreateComponentOptions<Component>['properties']>[number], 'condition'>;
