import type { InputSignal } from './input-signal.type';

/**
 * The key of the alias of an input in its type: it exists only in the types.
 */
declare const INPUT_ALIAS: unique symbol;

/**
 * The type of an input declaring an `alias`: the name the templates, `createComponent` and `renderToString` bind it with,
 * in place of the name of its property. `@Property` requires it when its `alias` option is set, with the same alias.
 *
 * @example
 * ```ts
 * \@Property('', { alias: 'user-id' })
 * public accessor userId!: Aliased<InputSignal<string>, 'user-id'>;
 * ```
 *
 * @template Signal - The signal of the input.
 * @template Alias - The alias of the input.
 */
export type Aliased<Signal extends InputSignal, Alias extends string> = Signal & {
  /**
   * The alias of the input. Never set: it exists only in the types.
   */
  readonly [INPUT_ALIAS]: Alias;
};
