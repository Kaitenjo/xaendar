/**
 * An abstract constructor function type that can accept any number of arguments
 * and return an instance of the specified type.
 */
export type AbstractConstructor<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (abstract new (...args: any[]) => T) & (Statics extends undefined ? object : Statics);