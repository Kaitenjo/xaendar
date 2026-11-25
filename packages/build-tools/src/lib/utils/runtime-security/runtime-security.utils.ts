import type { SecurityOptions } from '@xaendar/compiler';

/**
 * Writes the `security` the runtime of `@xaendar/core` applies (`__XAENDAR_SECURITY__`, read by `SECURITY`): the
 * options of the project, with their defaults (`'remove'` for `urls` and `resourceUrls`, `true` for
 * `rejectUnsafeBindings`) and its trusted origins. The runtime applies them to every component the project renders,
 * the ones of its libraries included, which declare no security: the URLs bound in the templates, which the compiler
 * only flags, and the `@HostAttribute`s.
 *
 * @param security - The options of the project.
 * @returns The object, as the code of the `define` of Vite.
 * @throws If a trusted origin is not an origin (`https://cdn.example.com`).
 */
export function toRuntimeSecurity(security: SecurityOptions): string {
  const trustedOrigins = new Set<string>();
  addOrigins(trustedOrigins, security.trustedOrigins);

  return JSON.stringify({
    urls: security.urls ?? 'remove',
    resourceUrls: security.resourceUrls ?? 'remove',
    trustedOrigins: Array.from(trustedOrigins),
    rejectUnsafeBindings: security.rejectUnsafeBindings ?? true
  });
}

/**
 * Adds the trusted origins of some options, as `URL.origin` writes them (`https://cdn.example.com/` gives
 * `https://cdn.example.com`).
 *
 * @param trustedOrigins - The origins, filled.
 * @param listed - The origins the options list, if any.
 * @throws If an origin listed is not an origin: no scheme and host, or a path, a query or a fragment after them.
 */
function addOrigins(trustedOrigins: Set<string>, listed: readonly string[] | undefined): void {
  if (!listed?.length) {
    return;
  }

  for (let i = 0; i < listed.length; i++) {
    const origin = readOrigin(listed[i]);
    if (origin === undefined) {
      throw new Error(`"trustedOrigins" of the security of xaendar.json lists ${listed[i]}, which is not an origin: write its scheme, its host and its port, if any, as https://cdn.example.com`);
    }

    trustedOrigins.add(origin);
  }
}

/**
 * Reads the origin a trusted origin names.
 *
 * @param listed - The origin, as listed.
 * @returns The origin, `undefined` when it is not one.
 */
function readOrigin(listed: string): string | undefined {
  try {
    const url = new URL(listed);
    return url.origin !== 'null' && url.href === `${url.origin}/` ? url.origin : undefined;
  } catch {
    return undefined;
  }
}
