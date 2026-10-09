import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';
import type { CodeLang } from '../../core/highlight/highlight';
import { translations } from '../../core/i18n/i18n';
import { getSnippet } from '../../core/sources/sources';
import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * A highlighted block of code, with a copy button.
 *
 * The code is either passed directly (`code` and `lang`) or read from `src/snippets`
 * (`snippet`). An `error` shows the output of the compiler below the code, for snippets
 * that do not compile on purpose.
 */
@WebComponent({
  selector: 'docs-code',
  templateUrl: './docs-code.xd.component.html',
  styleUrl: './docs-code.xd.component.css'
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
   * The path of a snippet in `src/snippets`, whose content and language replace `code` and `lang`.
   */
  @Property('')
  public accessor snippet!: InputSignal<string>;
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
   * The texts of the user interface.
   */
  public readonly t = translations;
  /**
   * Whether the code was just copied.
   */
  public readonly copied = signal(false);
  /**
   * The file being shown.
   */
  public readonly source = computed(() => this._computeSource());
  /**
   * The code being shown, without trailing blank lines.
   */
  public readonly text = computed(() => this._computeText());
  /**
   * The file name shown above the code. Plain text snippets (diagrams, terminal output) show none by default.
   */
  public readonly caption = computed(() => this._computeCaption());
  /**
   * The classes of the frame.
   */
  public readonly classes = computed(() => this._computeClasses());
  /**
   * Every language the highlighter understands.
   */
  private readonly _codeLangs: readonly CodeLang[] = ['ts', 'html', 'css', 'json', 'bash', 'text'];
  /**
   * Resets the copy button label.
   */
  private _resetTimer: ReturnType<typeof setTimeout> | undefined;

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
   * Computes the value of `source`.
   *
   * @returns The file being shown.
   */
  private _computeSource(): SourceFile {
    if (this.snippet()) {
      return getSnippet(this.snippet());
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
    return this.bare() ? '' : this.filename() || (this.snippet() && this.source().lang !== 'text' ? this.source().name : '');
  }

  /**
   * Computes the value of `classes`.
   *
   * @returns The classes of the frame.
   */
  private _computeClasses(): string {
    const classes = ['box'];
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
