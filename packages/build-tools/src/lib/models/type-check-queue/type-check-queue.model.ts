import { getLanguageService } from '@xaendar/language-core';
import { registerDependency } from '../../registry/dependency-registry/dependency-registry';
import type { TemplateTypeCheck } from '../../types/template-type-check.type';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import { collectProjectDependencies } from '../../utils/project-dependencies/project-dependencies.utils';
import { reportTemplateDiagnostics } from '../../utils/template-type-check/template-type-check.utils';
import { collectFileDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';

/**
 * How long the queue waits for the files served to settle, in milliseconds: a check queued meanwhile waits for the next
 * pause, so that the files a page asks for are checked together, once the page has them.
 *
 * N.B. Deliberate, for speed: measured on the site, 300 ms let the browser load a page before the checks run (5.7 s for
 * the home page, 10 s with 100 ms, which checked between the requests of the page). Do not shorten it.
 */
const QUIET_DELAY = 300;

/**
 * How long a check waits at most, in milliseconds, while files keep being served.
 */
const MAX_DELAY = 5000;

/**
 * The type-checks of the dev server, run in the background: the `transform` hook queues the files it serves and the
 * templates of their components, and serves them at once; the queue checks them once the files served settle, all on
 * one program, logging the errors and showing them in the overlay of Vite, then watches and registers the files each
 * template depends on (see the `hotUpdate` hook).
 *
 * N.B. Deliberate, for speed: a component is served before its template is checked, and a file with type errors is
 * served too, its errors reported a moment later. Checking each one as it was served made TypeScript rebuild the
 * program at every component, before answering the browser. Do not check them in the `transform` hook of the dev server.
 */
export class TypeCheckQueue {
  /**
   * The type-checks of the templates queued, by the path of their component: a template served again replaces its check.
   */
  private readonly _templates = new Map<string, TemplateTypeCheck>();
  /**
   * The TypeScript files queued, checked as a whole.
   */
  private readonly _files = new Set<string>();
  /**
   * The timer of the next run, `undefined` while nothing is queued.
   */
  private _timer: ReturnType<typeof setTimeout> | undefined;
  /**
   * When the oldest check queued was queued, as given by `Date.now()`.
   */
  private _queuedSince = 0;

  /**
   * @param _state - The plugin state: the compiler options and files of the project, the logger and the dev server.
   */
  constructor(private readonly _state: XaendarPluginState) { }

  /**
   * Queues the type-check of a template, replacing the one of the same component still queued.
   *
   * @param check - The type-check.
   */
  public queueTemplate(check: TemplateTypeCheck): void {
    this._templates.set(check.componentPath, check);
    this._schedule();
  }

  /**
   * Queues the type-check of a TypeScript file.
   *
   * @param fileName - The path of the file.
   */
  public queueFile(fileName: string): void {
    this._files.add(fileName);
    this._schedule();
  }

  /**
   * Drops the checks queued, e.g. when the dev server closes.
   */
  public cancel(): void {
    clearTimeout(this._timer);
    this._timer = undefined;
    this._templates.clear();
    this._files.clear();
  }

  /**
   * Runs the checks queued, all on one program: the files, then the templates. An error of the type-check itself is
   * logged, never thrown, since nothing awaits the run.
   */
  public run(): void {
    const templates = Array.from(this._templates.values());
    const files = Array.from(this._files);
    this.cancel();
    try {
      this._check(templates, files);
    } catch (error) {
      this._state.logError(error, 'Failed to type-check');
    }
  }

  /**
   * Schedules the next run after a pause of the files served, at most {@link MAX_DELAY} after the oldest check queued.
   */
  private _schedule(): void {
    const now = Date.now();
    if (this._timer === undefined) {
      this._queuedSince = now;
    } else {
      clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => this.run(), Math.max(0, Math.min(QUIET_DELAY, this._queuedSince + MAX_DELAY - now)));
    // A check left queued never keeps the process alive
    this._timer.unref();
  }

  /**
   * Checks the files and the templates, reporting their errors in the terminal and in the overlay of Vite, then watches
   * and registers the files each template depends on.
   *
   * @param templates - The type-checks of the templates.
   * @param files - The TypeScript files.
   */
  private _check(templates: readonly TemplateTypeCheck[], files: readonly string[]): void {
    const { compilerOptions, projectFileNames, server } = this._state;
    const languageService = getLanguageService(compilerOptions, projectFileNames);
    const logger = server?.config.logger ?? console;
    const errors = new Array<string>();
    for (let i = 0; i < files.length; i++) {
      const diagnostics = collectFileDiagnostics(languageService, files[i]);
      if (diagnostics.length) {
        const error = `[TypeChecker] Type check failed\n${formatTypeDiagnostics(diagnostics)}`;
        this._state.logError('', error);
        errors.push(error);
      }
    }

    for (let i = 0; i < templates.length; i++) {
      const { componentPath, shimPath } = templates[i];
      const templateErrors = reportTemplateDiagnostics(message => logger.warn(`[plugin xaendar] ${message}`), this._state, languageService, templates[i]);
      if (templateErrors?.length) {
        errors.push(...templateErrors);
      }

      const dependencies = collectProjectDependencies(languageService.getProgram()!, shimPath, compilerOptions);
      for (let j = 0; j < dependencies.length; j++) {
        const dependency = dependencies[j];
        if (dependency !== componentPath) {
          server?.watcher.add(dependency);
          registerDependency(dependency, componentPath);
        }
      }
    }

    if (errors.length) {
      server?.environments.client.hot.send({ type: 'error', err: { message: errors.join('\n\n'), stack: '', plugin: 'xaendar' } });
    }
  }
}
