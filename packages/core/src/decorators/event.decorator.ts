import { AccessorDecorator, ClassAccessorDecoratorValue } from '@xaendar/types';
import { BaseWebComponent } from '../directives/base-web-component';
import { EventParams } from '../types/event/event-params.type';
import { Output } from '../types/event/output.type';

function isEventParams(value: EventParams | unknown): value is EventParams {
  return !!value && typeof value === 'object' && ('bubbles' in value || 'cancelable' in value || 'composed' in value);
}

export function Event<
  Class extends BaseWebComponent,
  Field,
  Data = void,
>(params?: EventParams): AccessorDecorator<Class, Field, Output<Data>> {
  return (_value: ClassAccessorDecoratorValue<Field>, context: ClassAccessorDecoratorContext<Class, Output<Data>>): ReturnType<AccessorDecorator<Class, Field, Output<Data>>> => {
    const name = context.name;
    let dispatchEvent: EventTarget['dispatchEvent'];

    context.addInitializer(function (this: Class) {
      dispatchEvent = this.dispatchEvent.bind(this);
    });

    if (typeof name === 'symbol') {
      throw new Error('Symbol properties are not supported as event names');
    }

    const output: Output<Data> = {
      emit: (_valueOrOverrideParams?: Data | EventParams, _overrideParams?: EventParams) => { }
    };

    return {
      get(): Output<Data> {
        output.emit = function (this: Class, valueOrOverrideParams?: Data | EventParams, overrideParams?: EventParams) {
          let eventParams: CustomEventInit<Data> = {};

          eventParams = isEventParams(valueOrOverrideParams)
            ? { ...params, ...valueOrOverrideParams }
            : { ...params, ...overrideParams, detail: valueOrOverrideParams }

          const event = new CustomEvent(name, eventParams);
          dispatchEvent(event);
        };
        return output;
      }
    }
  }
}
