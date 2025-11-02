import { FunctionType } from "@xendar/common";

export type MethodDecorator<
 T extends Object,
  Method extends FunctionType
> = (value: Method, context: ClassMethodDecoratorContext<T, Method>) => Method | void;