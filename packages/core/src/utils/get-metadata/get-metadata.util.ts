import { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

/**
 * Reads the metadata the decorators stored in a class.
 *
 * @param klass - The class to read the metadata of.
 * @returns The metadata of the class, or `undefined` when none of its decorators stored any.
 */
export function getWebComponentMetadata(klass: object): WebComponentMetadata | undefined {
  return (klass as { [key: symbol]: WebComponentMetadata | undefined })[Symbol.for('Symbol.metadata')];
}