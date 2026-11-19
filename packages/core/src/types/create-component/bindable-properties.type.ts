import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { AliasedInputName } from './aliased-input-name.type';
import type { InputGetter } from './input-getter.type';
import type { InputName } from './input-name.type';
import type { InputOfName } from './input-of-name.type';

/**
 * The inputs of a component or of a directive bound by `createComponent`, each one with the getter of its value, by the
 * name the templates bind it with: its alias, when its type declares one (see `Aliased`), else the name of its property.
 * The getter runs in an effect, so the input follows the signals it reads.
 *
 * Written as a mapped type over the names the inputs are bound with, found in the `as` clause of a mapped type over
 * `keyof Target`, which reads the members a class declares even when it has an index signature, with the type of the
 * getter computed by a conditional type: this form lets TypeScript keep the literal returned by a getter (`() => 'wide'`)
 * for an input typed as a union of literals, which a clause renaming the keys would lose.
 *
 * @template Target - The component or the directive declaring the inputs.
 */
export type BindableProperties<Target extends CustomDirective | CustomElement> = {
  [Bound in keyof { [Name in keyof Target as InputName<Target, Name> | AliasedInputName<Target, Name>]: unknown } & string]?: InputGetter<InputOfName<Target, Bound>>
};
