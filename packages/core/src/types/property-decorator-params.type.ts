import { SignalEqual } from '@xaendar/signals';

export type PropertyDecoratorOptions<Value, ActualValue = Value> = {
  alias?: string;
  equals?: SignalEqual<Value>;
  transform?: (value: Value) => ActualValue;
};

export type PropertyDecoratorOptionsWithRequired<Value, ActualValue = Value> = PropertyDecoratorOptions<Value, ActualValue> & {
  required: true;
}