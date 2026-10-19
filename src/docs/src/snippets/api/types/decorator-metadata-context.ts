import type { DecoratorMetadataContext } from '@xaendar/types';

/**
 * What the `@Help` decorator stores in the metadata of a class.
 */
type HelpMetadata = {
  /**
   * The description of the command.
   */
  help: string
};

/**
 * Stores the description of a command in the metadata of its class.
 *
 * @param text - The description.
 * @returns The class decorator.
 */
function Help(text: string) {
  return (_klass: unknown, context: DecoratorMetadataContext<ClassDecoratorContext, HelpMetadata>): void => {
    context.metadata.help = text;   // typed: no cast, and a number does not compile
  };
}

/**
 * A command of a command line tool.
 */
@Help('Prints the version')
class VersionCommand { }
