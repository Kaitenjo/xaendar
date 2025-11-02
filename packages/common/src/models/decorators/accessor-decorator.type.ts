export type AccessorDecorator<
  Class extends Object, 
  Field = unknown,
  ReturnTypeField = Field
> = (
  value: ClassAccessorDecoratorValue<Field>,
  context: ClassAccessorDecoratorContext<Class, ReturnTypeField>
) => {
  get?: () => ReturnTypeField;
  set?: (value: ReturnTypeField) => void;
  init?: (initialValue: Field) => ReturnTypeField;
} | void;

export type ClassAccessorDecoratorValue<Field = unknown> = {
  get?: () => Field;
  set: (value: Field) => void;
};
