import { PositiveInteger } from "./positive-integer.type";

export type TupleOfLength<
  Length extends number,
  Acc extends number[] = []
> = PositiveInteger<Length> extends never
      ? never
      : Acc['length'] extends Length
        ? Acc
        : TupleOfLength<Length, [...Acc, number]>