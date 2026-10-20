import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import type { CodeLang } from '../../core/highlight/highlight';
import { describeSnippet, loadSnippet } from '../../core/sources/sources';
import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * A highlighted block of code, with a copy button.
 *
 * The code is either passed directly (`code` and `lang`) or given as a snippet (`snippet`): a `SourceFile`
 * exported by the `*.snippets.ts` module of a page, or the path of a file read from `src/snippets`. An `error`
 * shows the output of the compiler below the code, for snippets that do not compile on purpose.
 */
@WebComponent({
  selector: 'docs-code',
  styleUrl: './docs-code.xd.component.css',
  templateUrl: './docs-code.xd.component.html'
})
export class DocsCodeComponent extends CustomElement {
  /**
   * The code to show, when no `snippet` is given.
   */
  @Property('')
  public accessor code!: InputSignal<string>;
  /**
   * The language of `code`, one of {@link CodeLang} (`text` when unknown). Bound as `lang`: a member
   * named `lang` would clash with the `lang` property of `HTMLElement`.
   */
  @Property<InputSignal<CodeLang>>('ts', { alias: 'lang' })
  public accessor language!: InputSignal<CodeLang>;
  /**
   * The snippet whose content and language replace `code` and `lang`, and whose name is shown when `filename` is empty:
   * a source file, or the path of a file in `src/snippets`, loaded when a page shows it.
   */
  @Property<InputSignal<SourceFile | string>>('')
  public accessor snippet!: InputSignal<SourceFile | string>;
  /**
   * The file name shown above the code. Snippets show their own by default.
   */
  @Property('')
  public accessor filename!: InputSignal<string>;
  /**
   * The output of the compiler, shown below the code.
   */
  @Property('')
  public accessor error!: InputSignal<string>;
  /**
   * Marks the code as working (`good`) or not working (`bad`).
   */
  @Property('')
  public accessor verdict!: InputSignal<string>;
  /**
   * Hides the frame and the file name, for code embedded in another component.
   */
  @Property(false)
  public accessor bare!: InputSignal<boolean>;
  /**
   * Whether the code was just copied.
   */
  public readonly copied = signal(false);
  /**
   * The snippet loaded last, with the key it was loaded for.
   */
  public readonly loaded = signal<{ key: string; file: SourceFile } | undefined>(undefined);
  /**
   * The file being shown.
   */
  public readonly source = computed(() => this._computeSource());
  /**
   * The code being shown, without trailing blank lines.
   */
  public readonly text = computed(() => this._computeText());
  /**
   * The file name shown above the code. Plain text and error snippets (diagrams, terminal output) show none by default.
   */
  public readonly caption = computed(() => this._computeCaption());
  /**
   * The classes of the frame.
   */
  public readonly classes = computed(() => this._computeClasses());
  /**
   * Every language the highlighter understands.
   */
  private readonly _codeLangs: readonly CodeLang[] = ['ts', 'html', 'css', 'json', 'bash', 'text', 'error'];
  /**
   * Resets the copy button label.
   */
  private _resetTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Loads the snippet whenever its path changes: its content is fetched only when a page shows it.
   */
  public onInit(): void {
    this.effect(() => {
      const key = this.snippet();
      if (typeof key === 'string' && key) {
        untracked(() => this._load(key));
      }
    });
  }

  /**
   * Copies the code to the clipboard.
   */
  public async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => this.copied.set(false), 1600);
  }

  /**
   * Loads a snippet and, unless another one was asked for in the meantime, shows it.
   *
   * @param key - The path of the snippet.
   */
  private async _load(key: string): Promise<void> {
    const file = await loadSnippet(key);
    if (this.snippet() === key) {
      this.loaded.set({ key, file });
    }
  }

  /**
   * Computes the value of `source`.
   *
   * @returns The file being shown.
   */
  private _computeSource(): SourceFile {
    const key = this.snippet();
    if (typeof key !== 'string') {
      return key;
    }

    if (key) {
      const loaded = this.loaded();
      // Until the content arrives the snippet shows its name and language, so the frame does not change when it does
      return loaded?.key === key ? loaded.file : describeSnippet(key);
    }
    const lang = this.language();
    return { 
      name: this.filename(), 
      lang: this._codeLangs.includes(lang) ? lang : 'text', 
      code: this.code() 
    };
  }

  /**
   * Computes the value of `text`.
   *
   * @returns The code being shown, without trailing blank lines.
   */
  private _computeText(): string {
    return this.source().code.replace(/\s+$/, '');
  }

  /**
   * Computes the value of `caption`.
   *
   * @returns The file name shown above the code.
   */
  private _computeCaption(): string {
    const lang = this.source().lang;
    return this.bare() ? '' : this.filename() || (this.snippet() && lang !== 'text' && lang !== 'error' ? this.source().name : '');
  }

  /**
   * Computes the value of `classes`.
   *
   * @returns The classes of the frame.
   */
  private _computeClasses(): string {
    const classes = ['box'];
    if (this.source().lang === 'error') {
      classes.push('box--error');
    }
    if (this.bare()) {
      classes.push('box--bare');
    }
    if (this.caption() || this.verdict()) {
      classes.push('box--captioned');
    }
    if (this.verdict()) {
      classes.push(`box--${this.verdict()}`);
    }
    return classes.join(' ');
  }
}
