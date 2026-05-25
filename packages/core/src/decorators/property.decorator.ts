import { INTERNAL_OBSERVED_ATTRIBUTES } from '../costants';
import { BaseWebComponent } from '../directives/base-web-component';
import { PropertyDecoratorOptions } from '../types/property-decorator-params.type';

export function Property<Class extends BaseWebComponent, Value, ActualValue = Value>(params?: PropertyDecoratorOptions<Value, ActualValue>) {
  return function (_target: undefined, context: ClassFieldDecoratorContext<Class, Value>): void {
    const propertyKey = context.name;

    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol properties are not supported');
    }

    const metadata = context.metadata as { [INTERNAL_OBSERVED_ATTRIBUTES]?: string[] };
    metadata[INTERNAL_OBSERVED_ATTRIBUTES] ??= [];
    metadata[INTERNAL_OBSERVED_ATTRIBUTES].push(propertyKey);
  };
}