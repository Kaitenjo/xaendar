import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Renames an item by replacing its object, in a list tracked by identifier and in one tracked by identity, and by
 * setting a signal inside the item.
 */
@WebComponent({
  selector: 'ex-replaced-object',
  templateUrl: './replaced-object.xd.component.html',
  styleUrl: './replaced-object.css'
})
export class ReplacedObjectComponent extends CustomElement {
  /**
   * The fruits.
   */
  public readonly fruits = signal([{ id: 1, name: 'apple' }, { id: 2, name: 'pear' }]);
  /**
   * The same fruits, with the name in a signal: renaming one changes the signal, not the object.
   */
  public readonly liveFruits = [{ id: 1, name: signal('apple') }, { id: 2, name: signal('pear') }];

  /**
   * Replaces the first fruit with a new object with the same identifier, and renames the first live fruit.
   */
  public rename(): void {
    this.fruits.update(([first, ...rest]) => first ? [{ ...first, name: first.name.toUpperCase() }, ...rest] : rest);
    this.liveFruits[0]?.name.update(name => name.toUpperCase());
  }
}
