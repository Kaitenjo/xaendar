import { computed, signal } from '@xaendar/core/signals';

/**
 * A route matched by the router, with the parameters read from the path.
 */
export type Route = {
  /**
   * The name of the matched route.
   */
  readonly name: 'home' | 'users' | 'user' | 'not-found';
  /**
   * The parameters read from the path, by name.
   */
  readonly params: Record<string, string>;
};

/**
 * The patterns of the application, in order of priority. A segment starting with a colon is a parameter.
 */
const PATTERNS: Array<[pattern: string, name: Route['name']]> = [
  ['/', 'home'],
  ['/users', 'users'],
  ['/users/:id', 'user']
];

/**
 * The current path. This router keeps it in memory: a real one would read it from location.hash
 * or location.pathname, and write it back.
 */
export const path = signal('/');

/**
 * The paths visited before the current one.
 */
const visited = signal(new Array<string>());

/**
 * Whether there is a page to go back to.
 */
export const canGoBack = computed(() => visited().length > 0);

/**
 * Matches a path against a pattern.
 *
 * @param pattern - The pattern, such as /users/:id.
 * @param target - The path.
 * @returns The parameters, or null when the path does not match.
 */
function match(pattern: string, target: string): Record<string, string> | null {
  const expected = pattern.split('/');
  const actual = target.split('/');
  if (expected.length !== actual.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < expected.length; i++) {
    const segment = expected[i] ?? '';
    const value = actual[i] ?? '';
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(value);
    } else if (segment !== value) {
      return null;
    }
  }
  return params;
}

/**
 * The route of the current path.
 */
export const route = computed<Route>(() => {
  for (const [pattern, name] of PATTERNS) {
    const params = match(pattern, path());
    if (params) {
      return { name, params };
    }
  }
  return { name: 'not-found', params: {} };
});

/**
 * Goes to a path.
 *
 * @param target - The path.
 */
export function navigate(target: string): void {
  if (target !== path()) {
    visited.update(list => [...list, path()]);
    path.set(target);
  }
}

/**
 * Goes back to the previous path.
 */
export function back(): void {
  const list = visited();
  const previous = list[list.length - 1];
  if (previous !== undefined) {
    visited.set(list.slice(0, -1));
    path.set(previous);
  }
}
