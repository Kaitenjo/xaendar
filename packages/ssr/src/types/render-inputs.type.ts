import type { InputGetters } from './input-getters.type';

/**
 * The inputs `renderToString` sets on the component it renders, by the name of their property, each one with its value:
 * the ones `createComponent` binds, with values in place of getters.
 *
 * @template Component - The component.
 */
export type RenderInputs<Component> = {
  [Name in keyof InputGetters<Component>]?: ReturnType<NonNullable<InputGetters<Component>[Name]>>
};
