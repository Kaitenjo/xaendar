export type FunctionType<
  Arguments extends any[] = any[],
  ReturnType = unknown
> = (...args: Arguments) => ReturnType;
