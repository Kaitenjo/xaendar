import { PositiveInteger } from './positive-integer.type';

export type TupleOfLength<
  Length extends number,
  TupleType = number,
  Acc extends TupleType[] = []
> = PositiveInteger<Length> extends never
      ? never
      : Acc['length'] extends Length
        ? Acc
        : TupleOfLength<Length, TupleType, [...Acc, TupleType]>