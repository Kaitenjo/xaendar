import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Entry } from './entry.type';

/**
 * Renders a tree with a template rendering itself for the entries of each folder.
 */
@WebComponent({
  selector: 'ex-file-tree',
  styleUrl: './file-tree.css',
  templateUrl: './file-tree.xd.component.html'
})
export class FileTreeComponent extends CustomElement {
  /**
   * The entries at the top of the tree.
   */
  public readonly entries = signal<Entry[]>([
    {
      name: 'src',
      children: [
        { name: 'main.ts', children: [] },
        { name: 'ui', children: [{ name: 'card.xd.component.ts', children: [] }] }
      ]
    },
    { name: 'package.json', children: [] }
  ]);

  /**
   * The number of files added, which names the next one.
   */
  private _added = 0;

  /**
   * Adds a file to the folder `src/ui`: only the rows of the new entry are rendered.
   */
  public addFile(): void {
    this._added++;
    const file: Entry = { name: `new-${this._added}.ts`, children: [] };
    this.entries.update(entries => entries.map(entry => (entry.name === 'src' ? { ...entry, children: entry.children.map(child => (child.name === 'ui' ? { ...child, children: [...child.children, file] } : child)) } : entry)));
  }
}
