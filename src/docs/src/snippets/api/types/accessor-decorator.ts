import type { AccessorDecorator } from '@xaendar/types';

/**
 * Keeps a number accessor between two bounds, from its initial value on.
 *
 * @param min - The lowest value.
 * @param max - The highest value.
 * @returns The decorator.
 */
function Clamp(min: number, max: number): AccessorDecorator<object, number> {
  const clamp = (input: number): number => Math.min(Math.max(input, min), max);
  return value => ({
    init: initialValue => clamp(initialValue),
    set(next) {
      value.set.call(this, clamp(next)); // the original setter, with the instance as this
    }
  });
}

/**
 * The volume of a player.
 */
class Volume {
  /**
   * The level, from 0 to 10.
   */
  @Clamp(0, 10)
  public accessor level = 5;
}

/**
 * A player at full volume.
 */
const volume = new Volume();
volume.level = 15;
volume.level; // 10
