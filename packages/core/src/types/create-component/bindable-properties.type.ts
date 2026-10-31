import type { InputName } from './input-name.type';
import type { InputGetter } from './input-getter.type';

/**
 * The inputs of a component or of a directive bound by `createComponent`, each one with the getter of its value. The getter
 * runs in an effect, so the input follows the signals it reads.
 *
 * Written as a mapped type over `keyof Target`, filtering the names in the `as` clause, with the type of the getter computed
 * by a conditional type: this form lets TypeScript keep the literal returned by a getter (`() => 'wide'`) for an input typed
 * as a union of literals, and infer the type of a directive from its entry.
 *
 * @template Target - The component or the directive declaring the inputs.
 */
export type BindableProperties<Target> = {
  [Name in keyof Target as InputName<Target, Name>]?: InputGetter<Target[Name]>
};
