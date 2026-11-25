import type { _SecurityConfig } from '../../types/security-config.type';

/**
 * The `security` of the project, written by the plugin of `@xaendar/build-tools` in place of the identifier (the
 * `define` of Vite), with the trusted origins of its libraries. Nothing defines it where the code of core is not bundled
 * by the plugin, as in the tests.
 */
declare const __XAENDAR_SECURITY__: _SecurityConfig | undefined;

/**
 * The checks applied where nothing defines the `security` of the project: the defaults of `xaendar.json`.
 */
const DEFAULT_SECURITY: _SecurityConfig = {
  urls: 'remove',
  resourceUrls: 'remove',
  trustedOrigins: [],
  rejectUnsafeBindings: true
};

/**
 * The `security` of `xaendar.json` the runtime applies: as the plugin of `@xaendar/build-tools` defines it, the
 * defaults of `xaendar.json` otherwise (see `_SecurityConfig`). The templates are checked as the compiler flags their
 * bindings, with the options of their library; the `@HostAttribute` of the components and of the directives, which no
 * template compiles, with the ones of the project.
 */
export const SECURITY: _SecurityConfig = typeof __XAENDAR_SECURITY__ === 'object' ? __XAENDAR_SECURITY__ : DEFAULT_SECURITY;
