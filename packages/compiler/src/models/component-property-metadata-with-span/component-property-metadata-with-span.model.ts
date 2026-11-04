import type { SourceFile } from 'typescript';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { Span } from '../../types/span.type';

/**
 * Represents a component property with metadata from @Property decorator.
 */
export class ComponentPropertyMetadataWithSpan extends ComponentPropertyMetadata {
  /**
   * Creates an instance of ComponentPropertyMetadataWithSpan.
   * @param span The span information for the property in the source file.
   * @param sourceFile The source file declaring the property: the class itself, or one of its base classes.
   * @param name The name of the property.
   * @param type The type of the property.
   * @param options Additional options for the property, such as whether it is required or has an alias.
   */
  constructor(public span: Span, public sourceFile: SourceFile, name: string, type: string, options?: { required?: boolean, alias?: string }) {
    super(name, type, options);
  }
}
