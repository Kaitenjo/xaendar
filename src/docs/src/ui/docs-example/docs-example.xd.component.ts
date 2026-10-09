import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { getExampleFiles } from '../../core/sources/sources';
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
  templateUrl: './docs-example.xd.component.html',
  styleUrl: './docs-example.xd.component.css'
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
   * The texts of the user interface.
   */
  public readonly t = translations;
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
   * The source files of the example.
   */
  public readonly files = computed(() => this._computeFiles());
  /**
   * The file being shown.
   */
  public readonly current = computed(() => this._computeCurrent());

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
   * Computes the value of `files`.
   *
   * @returns The source files of the example.
   */
  private _computeFiles(): SourceFile[] {
    return getExampleFiles(this.name());
  }

  /**
   * Computes the value of `current`.
   *
   * @returns The file being shown.
   */
  private _computeCurrent(): SourceFile {
    const files = this.files();
    return files.find(file => file.name === this.selected()) ?? files[0] ?? { name: '', lang: 'text', code: `No files found in src/examples/${this.name()}` };
  }
}
