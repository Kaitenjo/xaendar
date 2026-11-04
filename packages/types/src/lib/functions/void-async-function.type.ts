/**
 * An async function type that accepts arguments but always resolves to void.
 * Typically used for async callbacks or side-effect functions.
 * @template Arguments - The types of the function arguments
 * @example
 * type OnUserChangeAsync = VoidAsyncFunction<[user: User]>;
 * const handleUserChangeAsync: OnUserChangeAsync = async (user) => await api.logChange(user);
 */
export type VoidAsyncFunction<Arguments extends any[] = any[]> = (...args: Arguments) => Promise<void>;