import { CustomElement, Property, Query, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import type { InputSignal, QuerySignal } from '@xaendar/core/signals';
import { loadDemoFiles } from '../../core/sources/sources';
import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * A demo application, running in an iframe, next to its source files.
 *
 * The application is a standalone project in `src/docs/demos`, written in another framework and built with its
 * own toolchain into `public/demos`: the code shown in the tabs is the code of the application that runs above
 * them. The frame is loaded only when the reader scrolls to it, and takes the height of its content.
 *
 * @example
 * <docs-demo name="react" heading="A React application" />
 */
@WebComponent({
  selector: 'docs-demo',
  styleUrl: './docs-demo.xd.component.css',
  templateUrl: './docs-demo.xd.component.html'
})
export class DocsDemoComponent extends CustomElement {
  /**
   * The name of the application, i.e. its folder under `src/docs/demos`.
   */
  @Property.required()
  public accessor name!: InputSignal<string>;
  /**
   * The title of the demo.
   */
  @Property('')
  public accessor heading!: InputSignal<string>;
  /**
   * The frame the application runs in.
   */
  @Query('.frame')
  public accessor frame!: QuerySignal<HTMLIFrameElement | null>;
  /**
   * Whether the source files are shown.
   */
  public readonly open = signal(false);
  /**
   * The name of the file chosen by the reader, the first file by default.
   */
  public readonly selected = signal('');
  /**
   * The source files of the application, empty until they are loaded.
   */
  public readonly files = signal<SourceFile[]>([]);
  /**
   * The page of the application, relative to the documentation site.
   */
  public readonly src = computed(() => this._computeSrc());
  /**
   * The file being shown.
   */
  public readonly current = computed(() => this._computeCurrent());
  /**
   * Follows the size of the page in the frame, to keep the frame as tall as its content.
   */
  private _observer?: ResizeObserver;

  /**
   * Loads the source files the first time they are shown, and again if the application changes: they are
   * fetched only when the reader asks for them.
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
   * Measures the page of the frame once it is loaded. The frame comes from the same origin, so its document is
   * readable: this is how the frame is sized without the applications having to report their height.
   */
  public afterRender(): void {
    const frame = this.frame();
    frame?.addEventListener('load', () => this._fit(frame));
  }

  /**
   * Shows or hides the source files.
   */
  public toggleCode(): void {
    this.open.set(!this.open());
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
   * Computes the value of `src`.
   *
   * The file is named: asking for the folder would land on the fallback of the dev server, which answers every
   * request for a page it does not have with the `index.html` of the documentation, and the frame would show
   * the documentation itself.
   *
   * @returns The page of the application, relative to the documentation site.
   */
  private _computeSrc(): string {
    return `demos/${this.name()}/index.html`;
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

  /**
   * Loads the source files of an application and, unless another one was asked for in the meantime, shows them.
   *
   * @param name - The name of the application.
   */
  private async _load(name: string): Promise<void> {
    const files = await loadDemoFiles(name);
    if (!files?.length) {
      console.error(`No files found in src/docs/demos/${name}`);
      return;
    }

    if (this.name() === name) {
      this.files.set(files);
    }
  }

  /**
   * Gives the frame the height of its content, and follows it when the page reflows.
   *
   * @param frame - The frame the application runs in.
   */
  private _fit(frame: HTMLIFrameElement): void {
    const body = frame.contentDocument?.body;
    if (!body) {
      return;
    }

    const resize = () => frame.style.height = `${body.scrollHeight}px`;
    resize();
    this._observer?.disconnect();
    this._observer = new ResizeObserver(resize);
    this._observer.observe(body);
  }

  /**
   * Stops following the size of the page in the frame.
   */
  public onDestroy(): void {
    this._observer?.disconnect();
  }
}
