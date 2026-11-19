/**
 * A function type that can accept any number of arguments and return a promise of any type.
 */
export type AsyncFunction<
  Arguments extends any[] = any[],
  ReturnType = void
> = Arguments extends Array<any>
  ? (...args: Arguments) => Promise<ReturnType>
  : () => Promise<ReturnType>;