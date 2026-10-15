import type { Constructor, Dictionary } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_HOST_DIRECTIVES, INTERNAL_SELECTOR } from '../../costants';
import type { HostDirectiveOptions } from './host-directive-options.type';

/**
 * The metadata a Web Component Class stores through its decorators, as the ones of the host directives of a component and
 * the ones of the inputs of a class.
 */
export type WebComponentMetadata = {
  [INTERNAL_HOST_DIRECTIVES]?: Array<Constructor<CustomDirective> | HostDirectiveOptions>,
  [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Dictionary<string, string>
  [INTERNAL_SELECTOR]: string
};
