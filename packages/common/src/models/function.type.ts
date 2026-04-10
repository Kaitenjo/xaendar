/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A function type that can accept any number of arguments and return any type.
 */
export type Function<
  Arguments extends any[] = any[],
  ReturnType = void
> = Arguments extends Array<any>
  ? (...args: Arguments) => ReturnType
  : () => ReturnType;

/**
 * A function type that can accept any number of arguments and return a promise of any type.
 */
export type AsyncFunction<
  Arguments extends any[] = any[],
  ReturnType = void
> = Arguments extends Array<any>
  ? (...args: Arguments) => Promise<ReturnType>
  : () => Promise<ReturnType>;

/**
 * A function type that accepts no arguments and returns a value of the specified type.
 * Also known as a "thunk" in functional programming.
 * @template ReturnType - The return type of the function (defaults to void)
 * @example
 * type GetUser = FunctionNoArgs<User>;
 * const getUser: GetUser = () => ({ id: 1, name: 'John' });
 */
export type NoArgsFunction <ReturnType = void> = () => ReturnType;

/**
 * An async function type that accepts no arguments and returns a promise of the specified type.
 * @template ReturnType - The type that the promise resolves to (defaults to void)
 * @example
 * type FetchUser = AsyncFunctionNoArgs<User>;
 * const fetchUser: FetchUser = async () => await api.getUser();
 */
export type NoArgsAsyncFunction <ReturnType = void> = () => Promise<ReturnType>;

/**
 * A function type that accepts arguments but always returns void.
 * Typically used for callbacks, event handlers, or side-effect functions.
 * @template Arguments - The types of the function arguments
 * @example
 * type OnUserChange = VoidFunction<[user: User]>;
 * const handleUserChange: OnUserChange = (user) => console.log(user);
 */
export type VoidFunction<Arguments extends any[] = any[]> = (...args: Arguments) => void;

/**
 * An async function type that accepts arguments but always resolves to void.
 * Typically used for async callbacks or side-effect functions.
 * @template Arguments - The types of the function arguments
 * @example
 * type OnUserChangeAsync = AsyncVoidFunction<[user: User]>;
 * const handleUserChangeAsync: OnUserChangeAsync = async (user) => await api.logChange(user);
 */
export type AsyncVoidFunction<Arguments extends any[] = any[]> = (...args: Arguments) => Promise<void>;

/**
 * A constructor function type that can accept any number of arguments and return an instance of any type.
 */
export type ConstructorFunction<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (new (...args: any[]) => T) & (Statics extends undefined ? object : Statics);

/**
 * An abstract constructor function type that can accept any number of arguments
 * and return an instance of the specified type.
 */
export type AbstractConstructorFunction<
  T extends object = object,
  Statics extends Record<string, unknown> | undefined = undefined
> = (abstract new (...args: any[]) => T) & (Statics extends undefined ? object : Statics);
