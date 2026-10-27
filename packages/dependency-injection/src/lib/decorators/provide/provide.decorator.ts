import { FieldDecorator } from '@xaendar/types';

export function provide<T = unknown>(token: T, options: any): FieldDecorator<object, T, T> {
  return (_field: undefined, _context: ClassFieldDecoratorContext<object, T>) => {
    return (value: T) => {
      return value;
    }
  }
}