import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Computed, InputSignal } from '@xaendar/core/signals';
import type { CodeLang } from '../../core/highlight/highlight';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import { getSnippet } from '../../core/sources/sources';
import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * Every language the highlighter understands.
 */
const CODE_LANGS: readonly CodeLang[] = ['ts', 'html', 'css', 'json', 'bash', 'text'];

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
   * The language of `code`, one of {@link CodeLang} (`text` when unknown).
   */
  @Property('ts')
  public accessor lang!: InputSignal<string>;

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
  public readonly t: Computed<Messages> = t;

  /**
   * Whether the code was just copied.
   */
  public readonly copied = signal(false);

  /**
   * The file being shown.
   */
  public readonly source = computed<SourceFile>(() => {
    if (this.snippet()) {
      return getSnippet(this.snippet());
    }
    const lang = this.lang() as CodeLang;
    return { name: this.filename(), lang: CODE_LANGS.includes(lang) ? lang : 'text', code: this.code() };
  });

  /**
   * The code being shown, without trailing blank lines.
   */
  public readonly text = computed(() => this.source().code.replace(/\s+$/, ''));

  /**
   * The file name shown above the code. Plain text snippets (diagrams, terminal output) show none by default.
   */
  public readonly caption = computed(() => this.bare() ? '' : this.filename() || (this.snippet() && this.source().lang !== 'text' ? this.source().name : ''));

  /**
   * The classes of the frame.
   */
  public readonly classes = computed(() => {
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
  });

  /**
   * Resets the copy button label.
   */
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

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
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), 1600);
  }
}
