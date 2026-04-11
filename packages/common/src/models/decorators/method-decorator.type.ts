import { FunctionType } from '../function.type';

export type MethodDecorator<
 T extends Object,
  Method extends FunctionType
> = (value: Method, context: ClassMethodDecoratorContext<T, Method>) => Method | void;