import { Constructor } from '@xaendar/types';
import { INTERNAL_OBSERVED_ATTRIBUTES } from '../costants';
import { BaseWebComponent } from '../directives/base-web-component';

export type BaseWebComponentConstructor = Constructor<BaseWebComponent, {
  observedAttributes: string[]
  [INTERNAL_OBSERVED_ATTRIBUTES]: string[]
}>;