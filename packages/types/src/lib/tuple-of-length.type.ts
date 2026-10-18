import { PositiveInteger } from './positive-integer.type';

/**
 * Constructs a fixed-length tuple of type `TupleType` with exactly `Length`
 * elements.
 *
 * Resolves to `never` when `Length` is negative or not an integer, and to `[]` when it is `0` or not a literal
 * (`number`). Lengths above 999 exceed the recursion limit of TypeScript.
 *
 * @template Length - The number of elements. Must be a non-negative integer literal.
 * @template TupleType - The element type. Defaults to `number`.
 * @template Acc - Internal accumulator (do not provide manually).
 *
 * @example
 * type Three = TupleOfLength<3, string>; // [string, string, string]
 * type Empty = TupleOfLength<0, string>; // []
 */
export type TupleOfLength<
  Length extends number,
  TupleType = number,
  Acc extends TupleType[] = []
> = PositiveInteger<Length> extends never
      ? never
      : Acc['length'] extends Length
        ? Acc
        : TupleOfLength<Length, TupleType, [...Acc, TupleType]>