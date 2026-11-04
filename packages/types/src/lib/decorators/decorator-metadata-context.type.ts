/**
 * Represents the context of a TC39 stage-3 decorator whose `metadata` has the shape the decorators of the class store in
 * it, instead of the untyped `DecoratorMetadataObject`.
 *
 * The metadata is `Partial`: while the class is being decorated it holds only what the decorators applied so far
 * stored, and the metadata of a subclass starts from the one of its parent class.
 *
 * @template Context - The context of the decorator, such as `ClassFieldDecoratorContext<Class, Value>`.
 * @template Metadata - The shape of the metadata. Defaults to `DecoratorMetadataObject`.
 */
export type DecoratorMetadataContext<
  Context extends { metadata: DecoratorMetadataObject },
  Metadata extends object = DecoratorMetadataObject
> = Omit<Context, 'metadata'> & {
  /**
   * The metadata of the class being decorated.
   */
  metadata: Partial<Metadata>
};
