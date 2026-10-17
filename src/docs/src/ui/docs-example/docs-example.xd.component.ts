import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import { loadExampleFiles } from '../../core/sources/sources';
import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * A live example: the running component, projected in its default slot, next to its source files.
 *
 * The files are read from the example folder in `src/examples`, so the code shown is exactly
 * the code that runs.
 *
 * @example
 * <docs-example name="signals/overview/counter" heading="A counter">
 *   <ex-counter />
 * </docs-example>
 */
@WebComponent({
  selector: 'docs-example',
  styleUrl: './docs-example.xd.component.css',
  templateUrl: './docs-example.xd.component.html'
})
export class DocsExampleComponent extends CustomElement {
  /**
   * The path of the example folder, relative to `src/examples`.
   */
  @Property.required()
  public accessor name!: InputSignal<string>;
  /**
   * The title of the example.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
  /**
   * The kind of example: `edge` for an edge case, empty for a regular one.
   */
  @Property('')
  public accessor kind!: InputSignal<string>;
  /**
   * Whether the source files are shown initially.
   */
  @Property(true)
  public accessor code!: InputSignal<boolean>;
  /**
   * Whether the source files are shown, `undefined` until the reader toggles them.
   */
  public readonly toggled = signal<boolean | undefined>(undefined);
  /**
   * Whether the source files are shown.
   */
  public readonly open = computed(() => this._computeOpen());
  /**
   * The name of the file chosen by the reader, the first file by default.
   */
  public readonly selected = signal('');
  /**
   * The source files of the example, empty until they are loaded.
   */
  public readonly files = signal<SourceFile[]>([]);
  /**
   * The file being shown.
   */
  public readonly current = computed(() => this._computeCurrent());

  /**
   * Loads the source files the first time they are shown, and again if the example changes: they are fetched
   * only when a page shows them.
   */
  public onInit(): void {
    this.effect(() => {
      const name = this.name();
      if (this.open()) {
        untracked(() => this._load(name));
      }
    });
  }

  /**
   * Shows or hides the source files.
   */
  public toggleCode(): void {
    this.toggled.set(!this.open());
  }

  /**
   * Shows a file.
   *
   * @param name - The name of the file.
   */
  public select(name: string): void {
    this.selected.set(name);
  }

  /**
   * Computes the value of `open`.
   *
   * @returns Whether the source files are shown.
   */
  private _computeOpen(): boolean {
    return this.toggled() ?? this.code();
  }

  /**
   * Loads the source files of an example and, unless another example was asked for in the meantime, shows them.
   *
   * @param name - The path of the example folder.
   */
  private async _load(name: string): Promise<void> {
    const files = await loadExampleFiles(name);
    if (!files.length) {
      console.error(`No files found in src/examples/${name}`);
    }

    if (this.name() === name) {
      this.files.set(files);
    }
  }

  /**
   * Computes the value of `current`.
   *
   * @returns The file being shown.
   */
  private _computeCurrent(): SourceFile {
    const files = this.files();
    return files.find(file => file.name === this.selected()) ?? files[0] ?? { name: '', lang: 'text', code: '' };
  }
}
