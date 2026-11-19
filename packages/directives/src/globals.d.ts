import type { TrustedTypePolicyFactory } from './types/trusted-types/trusted-type-policy-factory.type';

declare global {
  /**
   * The factory of the Trusted Types policies, which the DOM library of TypeScript does not declare: `undefined` where
   * the browser does not support Trusted Types, and on the server.
   */
  var trustedTypes: TrustedTypePolicyFactory | undefined;
}

export { };
