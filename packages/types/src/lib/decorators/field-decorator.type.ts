export type FieldDecorator<
  Class extends Object, 
  Field,
  ReturnType = Field
> = (field: undefined, context: ClassFieldDecoratorContext<Class, Field>) => ((value: Field) => ReturnType);