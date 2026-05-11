/**
 * A constructor function type that can accept any number of arguments and return an instance of any type.
 */
export type Constructor<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (new (...args: any[]) => T) & (Statics extends undefined ? object : Statics);