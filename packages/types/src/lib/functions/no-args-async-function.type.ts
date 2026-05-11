/**
 * An async function type that accepts no arguments and returns a promise of the specified type.
 * @template ReturnType - The type that the promise resolves to (defaults to void)
 * @example
 * type FetchUser = AsyncFunctionNoArgs<User>;
 * const fetchUser: FetchUser = async () => await api.getUser();
 */
export type NoArgsAsyncFunction <ReturnType = void> = () => Promise<ReturnType>;