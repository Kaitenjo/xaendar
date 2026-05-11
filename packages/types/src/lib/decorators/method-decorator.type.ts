import { Function } from '../functions/function.type';

export type MethodDecorator<
 T extends Object,
  Method extends Function
> = (value: Method, context: ClassMethodDecoratorContext<T, Method>) => Method | void;