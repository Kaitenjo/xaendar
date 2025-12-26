import { ContainsChar } from "./contains-char";

export type TupleOfLength<
  Length extends number,
  Acc extends number[] = []
> = ContainsChar<`${Length}`, '-'> extends true
    ? unknown
    : ContainsChar<`${Length}`, '.'> extends true
      ? unknown
      : Acc['length'] extends Length
        ? Acc
        : TupleOfLength<Length, [...Acc, number]>