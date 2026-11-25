import type { _TrustedTypePolicyFactory } from '@xaendar/core';

declare global {
  /**
   * The factory of the Trusted Types policies (see `toTrustedHtml`), `undefined` where the browser does not support
   * them. Declared with the type core declares it with, so that both declarations are the same where the sources of
   * core are compiled along, and this one alone where the library is built against the declarations of core, which
   * leave the globals out.
   */
  var trustedTypes: _TrustedTypePolicyFactory | undefined;
}

export { };
