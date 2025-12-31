import { ContainsChar } from "./contains-char";

export type PositiveInteger<Value extends number> =
  ContainsChar<`${Value}`, '-'> extends true
    ? never
    : ContainsChar<`${Value}`, '.'> extends true
      ? never
      : `${Value}` extends 'Infinity' | 'NaN'
        ? never
        : Value;