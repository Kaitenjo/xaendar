import { Constructor } from '@xaendar/types';
import { BaseWebComponent } from '../../directives/base-web-component';

export type BaseWebComponentConstructor = Constructor<BaseWebComponent, {
  observedAttributes: string[]
}>;