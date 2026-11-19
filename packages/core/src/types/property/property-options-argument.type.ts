/**
 * The options argument of `@Property` and of `@Property.required`: optional, without alias, for an accessor whose type
 * declares none, required with the alias the type of the accessor declares otherwise (see `Aliased`).
 *
 * @template Options - The options of the decorator, with the alias.
 * @template Alias - The alias the type of the accessor declares, `never` without one.
 */
export type PropertyOptionsArgument<Options extends { alias?: string }, Alias extends string> = [Alias] extends [never]
  ? [options?: Options]
  : [options: Options & { alias: Alias }];
