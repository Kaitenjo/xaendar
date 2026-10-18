import type { Constructor } from '@xaendar/types';

/**
 * A plugin of the editor.
 */
interface Plugin {
  /**
   * Starts the plugin.
   */
  start(): void;
}

/**
 * Creates and starts a plugin of each class.
 *
 * @param types - The classes of the plugins, each with a static id.
 * @returns The plugins, by the id of their class.
 */
function startPlugins(types: ReadonlyArray<Constructor<Plugin, { id: string }>>): Map<string, Plugin> {
  const plugins = new Map<string, Plugin>();
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const plugin = new type();
    plugin.start();
    plugins.set(type.id, plugin);
  }
  return plugins;
}

/**
 * Counts the words of the document.
 */
class WordCount implements Plugin {
  /**
   * The id of the plugin.
   */
  public static readonly id = 'word-count';

  /**
   * Starts counting.
   */
  public start(): void {
    console.log('Counting words');
  }
}

/**
 * Checks the spelling of the document. It has no static id.
 */
class Spellcheck implements Plugin {
  /**
   * Starts checking.
   */
  public start(): void {
    console.log('Checking the spelling');
  }
}

startPlugins([WordCount]);  // ✓
startPlugins([Spellcheck]); // ✗ Property 'id' is missing in type 'typeof Spellcheck' but required in type '{ id: string; }'.
