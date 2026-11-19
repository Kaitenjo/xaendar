/** 
 * Whether the library is runnign in development mode
 * Used to log extra information for example
 * - Invalid transition states for {@link Computed} or {@link Watcher}  
 */
let devMode = false;

/**
 * Sets the development mode flag.
 * @param mode - `true` to enable dev mode, `false` to disable it.
 */
export function setDevMode(mode: boolean): void {
  devMode = mode;
}

/**
 * Returns the current development mode state.
 * @returns `true` if dev mode is enabled, `false` otherwise.
 */
export function isDevMode(): boolean {
  return devMode;
}