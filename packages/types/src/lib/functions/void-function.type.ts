/**
 * A function type that accepts arguments but always returns void.
 * Typically used for callbacks, event handlers, or side-effect functions.
 * @template Arguments - The types of the function arguments
 * @example
 * type OnUserChange = VoidFunction<[user: User]>;
 * const handleUserChange: OnUserChange = (user) => console.log(user);
 */
export type VoidFunction<Arguments extends any[] = any[]> = (...args: Arguments) => void;