import { AccessorDecorator, ClassAccessorDecoratorValue } from '@xendar/common';
import { BaseWebComponent } from '../directives/base-web-component';
import { EventParams } from '../models/event/event-params.type';
import { Output } from '../models/event/output.type';

function isEventParams(value: EventParams | unknown): value is EventParams {
  return !!value && typeof value === 'object' && ('bubbles' in value || 'cancelable' in value || 'composed' in value);
}

export function Event<
  Class extends BaseWebComponent,
  Field,
  Data = void,
>(params?: EventParams): AccessorDecorator<Class, Field, Output<Data>> {
  return (_value: ClassAccessorDecoratorValue<Field>, context: ClassAccessorDecoratorContext<Class, Output<Data>>): ReturnType<AccessorDecorator<Class, Field, Output<Data>>> => {
    const output: Output<Data> = {
      emit: (_valueOrOverrideParams?: Data | EventParams, _overrideParams?: EventParams) => { }
     };

    return {
      get(): Output<Data> {
        output.emit = (valueOrOverrideParams?: Data | EventParams, overrideParams?: EventParams) => {
          let eventParams: CustomEventInit<Data> = {};

            eventParams = isEventParams(valueOrOverrideParams)
              ? { ...params, ...valueOrOverrideParams } 
              : { ...params, ...overrideParams, detail: valueOrOverrideParams }

            const event = new CustomEvent(context.name as string, eventParams);
            const classInstance = (this as Class);
            classInstance.dispatchEvent(event);
          };
          return output;
        }
      }
    }
  }