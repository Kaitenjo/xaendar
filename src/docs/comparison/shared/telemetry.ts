/*
  The telemetry panel of the comparison pages, written without any framework so that the three pages carry the
  same one. It lives in a shadow root of its own, above the page, and measures:
  - startup: time to the first rows of the table, JavaScript downloaded, DOM nodes;
  - interactions: for each click and input, the time until the frame the browser renders after it (the handler
    and the work the framework scheduled: in the same task, in a microtask, in a timer or in an animation frame)
    and until that frame is painted;
  - long animation frames (over 50 ms), with the scripts that ran in them;
  - memory: the JavaScript heap (`performance.memory`, Chromium only, rounded by the browser) and, when the page is
    cross-origin isolated, the whole memory of the page (`performance.measureUserAgentSpecificMemory`).
  The panel never measures itself: its own events are ignored and it redraws only after a measure is complete.
*/

/**
 * What the panel shows and how, kept between visits.
 */
interface TelemetryConfig {
  /**
   * The sections shown.
   */
  sections: { startup: boolean; interactions: boolean; frames: boolean; memory: boolean };
  /**
   * How often the memory and the DOM nodes are read, in milliseconds.
   */
  interval: number;
  /**
   * How many interactions and long frames are listed.
   */
  entries: number;
  /**
   * Whether only the header is shown.
   */
  collapsed: boolean;
  /**
   * The position of the panel in the page, `null` for the top right corner.
   */
  position: { x: number; y: number } | null;
}

/**
 * An interaction measured by the panel.
 */
interface Interaction {
  /**
   * The kind of event and the element, as `click · Apply`.
   */
  readonly label: string;
  /**
   * From the event to the animation frame after it, in milliseconds: the update of the page by the framework,
   * plus the wait for the frame (up to one frame).
   */
  readonly update: number;
  /**
   * From the event to the frame painted, in milliseconds: style, layout and paint included.
   */
  readonly paint: number;
}

/**
 * A long animation frame reported by the browser.
 */
interface LongFrame {
  /**
   * Its duration, in milliseconds.
   */
  readonly duration: number;
  /**
   * The part of it blocking the input, in milliseconds.
   */
  readonly blocking: number;
  /**
   * The longest script that ran in it, as `click · onClick (main.js) 34 ms`.
   */
  readonly script: string;
}

/**
 * The part of a `PerformanceEntry` of the `long-animation-frame` type the panel reads.
 */
interface LongAnimationFrameEntry extends PerformanceEntry {
  readonly blockingDuration: number;
  readonly scripts: ReadonlyArray<{ readonly invoker: string; readonly sourceFunctionName: string; readonly sourceURL: string; readonly duration: number }>;
}

/**
 * The non-standard memory of Chromium.
 */
interface ChromiumMemory {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
}

const STORAGE_KEY = 'xaendar-comparison-telemetry';
const DEFAULT_CONFIG: TelemetryConfig = {
  sections: { startup: true, interactions: true, frames: true, memory: true },
  interval: 2000,
  entries: 10,
  collapsed: false,
  position: null
};
const HISTORY = 40;
const PANEL_WIDTH = 300;
const HEADER_HEIGHT = 40;
/*
  N.B. Only composed events: `change` does not leave a shadow root, so the panel would miss it in Xaendar alone.
  A select fires `input` too.
*/
const MEASURED_EVENTS = ['click', 'input'];

const STYLES = `
  :host { all: initial; }
  .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }
  .panel {
    position: absolute;
    width: ${PANEL_WIDTH}px;
    max-height: calc(100vh - 24px);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    color: #e8ebf5;
    background: rgb(17 21 34 / 88%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgb(0 0 0 / 28%);
    backdrop-filter: blur(10px);
    font: 12px/1.4 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    overflow: hidden;
  }
  .head { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; cursor: grab; user-select: none; touch-action: none; }
  .head:active { cursor: grabbing; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px #4ade80; }
  .title { flex: 1; font-weight: 650; letter-spacing: 0.01em; }
  .title small { color: #9aa3bd; font-weight: 500; }
  .icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: #c5cbe0;
    background: transparent;
    border: 0;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .icon:hover, .icon[aria-pressed="true"] { background: rgb(255 255 255 / 10%); color: #fff; }
  .body { overflow: auto; padding: 0 12px 12px; }
  .settings { display: grid; gap: 8px; margin: 0 0 10px; padding: 10px; background: rgb(255 255 255 / 6%); border-radius: 10px; }
  .settings label { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .settings select { color: #e8ebf5; background: #1d2335; border: 1px solid rgb(255 255 255 / 15%); border-radius: 6px; font: inherit; }
  .settings .checks { display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .settings .checks label { justify-content: flex-start; gap: 4px; }
  .settings button { justify-self: start; color: #c5cbe0; background: rgb(255 255 255 / 8%); border: 0; border-radius: 6px; padding: 4px 8px; font: inherit; cursor: pointer; }
  section { margin-top: 10px; }
  h3 { display: flex; justify-content: space-between; margin: 0 0 6px; color: #9aa3bd; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .stat { padding: 6px 8px; background: rgb(255 255 255 / 6%); border-radius: 8px; }
  .stat b { display: block; font-size: 15px; font-variant-numeric: tabular-nums; }
  .stat span { color: #9aa3bd; font-size: 10.5px; }
  ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 3px; }
  li { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; padding: 4px 6px; border-radius: 6px; background: rgb(255 255 255 / 4%); }
  li .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li .value { font-variant-numeric: tabular-nums; text-align: right; min-width: 52px; }
  li.frame { grid-template-columns: auto 1fr; }
  .muted { color: #9aa3bd; }
  .good { color: #4ade80; } .fair { color: #facc15; } .poor { color: #f87171; }
  .legend { color: #9aa3bd; font-size: 10.5px; font-weight: 500; letter-spacing: 0; text-transform: none; }
  svg { display: block; width: 100%; height: 36px; margin-top: 6px; }
  .note { margin: 6px 0 0; color: #9aa3bd; font-size: 11px; }
  .measure { margin-top: 6px; color: #c5cbe0; background: rgb(255 255 255 / 8%); border: 0; border-radius: 6px; padding: 4px 8px; font: inherit; cursor: pointer; }
`;

/**
 * Reads the configuration kept in the browser, or the default one.
 *
 * @returns The configuration.
 */
function loadConfig(): TelemetryConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<TelemetryConfig> | null;
    return saved ? { ...DEFAULT_CONFIG, ...saved, sections: { ...DEFAULT_CONFIG.sections, ...saved.sections } } : structuredClone(DEFAULT_CONFIG);
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

/**
 * Keeps the configuration in the browser, when it can.
 *
 * @param config - The configuration.
 */
function saveConfig(config: TelemetryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode, sandboxed frame): the configuration lasts as long as the page
  }
}

/**
 * Counts the elements of the page, inside the shadow roots too.
 *
 * @param root - Where to start.
 * @returns The number of elements.
 */
function countElements(root: Document | ShadowRoot): number {
  const elements = root.querySelectorAll('*');
  let count = elements.length;
  for (let i = 0; i < elements.length; i++) {
    const shadow = elements[i]!.shadowRoot;
    if (shadow) {
      count += countElements(shadow);
    }
  }

  return count;
}

/**
 * Finds the first element matching a selector, inside the shadow roots too.
 *
 * @param root - Where to start.
 * @param selector - The selector.
 * @returns The element, `null` if none.
 */
function findDeep(root: Document | ShadowRoot, selector: string): Element | null {
  const found = root.querySelector(selector);
  if (found) {
    return found;
  }

  const elements = root.querySelectorAll('*');
  for (let i = 0; i < elements.length; i++) {
    const shadow = elements[i]!.shadowRoot;
    const inner = shadow ? findDeep(shadow, selector) : null;
    if (inner) {
      return inner;
    }
  }

  return null;
}

/**
 * Describes the element an event happened on, as the user sees it.
 *
 * @param event - The event.
 * @returns The description, as `click · Apply filters`.
 */
function describe(event: Event): string {
  const path = event.composedPath();
  const target = path[0];
  let name = target instanceof HTMLElement ? target.closest('label')?.querySelector('.ui-field__label')?.textContent ?? '' : '';
  // The text of a button may be projected through a slot: the first element of the path with a text has it
  for (let i = 0; i < path.length && !name.trim(); i++) {
    const element = path[i];
    if (element instanceof HTMLElement && !(element instanceof HTMLBodyElement)) {
      name = element.getAttribute('aria-label') ?? element.textContent ?? '';
    }
  }

  name = name.trim().replace(/\s+/g, ' ').slice(0, 40);
  return `${event.type} · ${name || 'page'}`;
}

/**
 * Formats a duration.
 *
 * @param ms - The duration, in milliseconds.
 * @returns The text, as `12.4 ms`.
 */
function ms(ms: number): string {
  return `${ms < 100 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

/**
 * Formats a size.
 *
 * @param bytes - The size, in bytes.
 * @returns The text, as `3.2 MB`.
 */
function size(bytes: number): string {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * The class coloring a duration: good under one frame at 60 Hz, fair under 50 ms, poor beyond.
 *
 * @param ms - The duration, in milliseconds.
 * @returns The class.
 */
function grade(ms: number): string {
  return ms <= 16.7 ? 'good' : ms <= 50 ? 'fair' : 'poor';
}

/**
 * Escapes a text for HTML.
 *
 * @param text - The text.
 * @returns The escaped text.
 */
function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * The telemetry panel.
 */
class TelemetryPanel {
  private readonly _config = loadConfig();
  private readonly _interactions = new Array<Interaction>();
  private readonly _frames = new Array<LongFrame>();
  private readonly _heap = new Array<number>();
  private readonly _host = document.createElement('xaendar-telemetry');
  private readonly _root = this._host.attachShadow({ mode: 'open' });
  private readonly _panel = document.createElement('div');
  private _settingsOpen = false;
  private _firstRows = NaN;
  private _javascript = NaN;
  private _elements = NaN;
  private _total: string | null = null;
  private _timer = 0;

  public constructor(private readonly _framework: string) { }

  /**
   * Adds the panel to the page and starts measuring.
   */
  public start(): void {
    const style = document.createElement('style');
    style.textContent = STYLES;
    const layer = document.createElement('div');
    layer.className = 'layer';
    this._panel.className = 'panel';
    layer.append(this._panel);
    this._root.append(style, layer);
    document.body.append(this._host);

    for (let i = 0; i < MEASURED_EVENTS.length; i++) {
      document.addEventListener(MEASURED_EVENTS[i]!, event => this._measure(event), { capture: true });
    }

    this._observeFrames();
    this._waitForRows();
    this._panel.addEventListener('pointerdown', event => this._drag(event));
    this._panel.addEventListener('click', event => this._command(event));
    this._panel.addEventListener('change', event => this._configure(event));
    window.addEventListener('resize', () => this._place());
    this._sample();
    this._restartTimer();
    this._render();
  }

  /**
   * Measures an interaction: the first task after the event marks the end of its JavaScript, the first timer after
   * the next animation frame marks the frame painted.
   *
   * @param event - The event.
   */
  private _measure(event: Event): void {
    if (event.composedPath().includes(this._host)) {
      return;
    }

    const start = event.timeStamp || performance.now();
    const label = describe(event);
    // Registered in a task after the event: the frames the framework requested meanwhile run before this one
    setTimeout(() => requestAnimationFrame(() => {
      const update = performance.now() - start;
      setTimeout(() => {
        this._interactions.unshift({ label, update, paint: performance.now() - start });
        this._interactions.length = Math.min(this._interactions.length, 50);
        this._render();
      }, 0);
    }), 0);
  }

  /**
   * Listens to the long animation frames, when the browser reports them.
   */
  private _observeFrames(): void {
    if (!PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      return;
    }

    new PerformanceObserver(list => {
      const entries = list.getEntries() as LongAnimationFrameEntry[];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]!;
        let longest = entry.scripts[0];
        for (let j = 1; j < entry.scripts.length; j++) {
          if (entry.scripts[j]!.duration > longest!.duration) {
            longest = entry.scripts[j];
          }
        }

        const file = longest?.sourceURL.split('/').pop() ?? '';
        const script = longest ? `${longest.invoker || longest.sourceFunctionName || 'script'}${file ? ` (${file})` : ''} ${ms(longest.duration)}` : 'rendering only';
        this._frames.unshift({ duration: entry.duration, blocking: entry.blockingDuration, script });
      }

      this._frames.length = Math.min(this._frames.length, 50);
      this._render();
    }).observe({ type: 'long-animation-frame', buffered: true });
  }

  /**
   * Waits for the first row of the table, to time the startup.
   */
  private _waitForRows(): void {
    const check = (): void => {
      if (findDeep(document, 'tbody tr')) {
        this._firstRows = performance.now();
        this._sample();
        this._render();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  }

  /**
   * Reads the memory, the DOM size and the JavaScript downloaded.
   */
  private _sample(): void {
    const memory = (performance as Performance & { memory?: ChromiumMemory }).memory;
    if (memory) {
      this._heap.push(memory.usedJSHeapSize);
      if (this._heap.length > HISTORY) {
        this._heap.shift();
      }
    }

    this._elements = countElements(document) - countElements(this._root);
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let bytes = 0;
    for (let i = 0; i < resources.length; i++) {
      if (resources[i]!.initiatorType === 'script' || resources[i]!.name.endsWith('.js')) {
        bytes += resources[i]!.encodedBodySize;
      }
    }

    this._javascript = bytes;
  }

  /**
   * Measures the whole memory of the page, when the page is cross-origin isolated.
   */
  private async _measureTotal(): Promise<void> {
    const measure = (performance as Performance & { measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }> }).measureUserAgentSpecificMemory;
    if (!crossOriginIsolated || !measure) {
      return;
    }

    this._total = 'measuring at the next garbage collection…';
    this._render();
    try {
      const { bytes } = await measure.call(performance);
      this._total = size(bytes);
    } catch (error) {
      this._total = `unavailable: ${String(error)}`;
    }

    this._render();
  }

  /**
   * Starts the periodic sampling again, after a change of interval.
   */
  private _restartTimer(): void {
    clearInterval(this._timer);
    this._timer = window.setInterval(() => {
      this._sample();
      this._render();
    }, this._config.interval);
  }

  /**
   * Moves the panel with the pointer, from its header.
   *
   * @param event - The `pointerdown` event.
   */
  private _drag(event: PointerEvent): void {
    const target = event.composedPath()[0];
    if (!(target instanceof Element) || !target.closest('.head') || target.closest('button')) {
      return;
    }

    const box = this._panel.getBoundingClientRect();
    const offsetX = event.clientX - box.left;
    const offsetY = event.clientY - box.top;
    const head = target.closest<HTMLElement>('.head')!;
    head.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent): void => {
      this._config.position = { x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY };
      this._place();
    };
    const end = (): void => {
      head.removeEventListener('pointermove', move);
      head.removeEventListener('pointerup', end);
      head.removeEventListener('pointercancel', end);
      saveConfig(this._config);
    };
    head.addEventListener('pointermove', move);
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }

  /**
   * Places the panel at its position, kept inside the viewport.
   */
  private _place(): void {
    // N.B. The fixed width and header height, never read from the layout: reading it would force the layout of the
    // whole page at each redraw, inside the frames the panel measures. Do not use offsetWidth or offsetHeight here.
    const position = this._config.position ?? { x: window.innerWidth - PANEL_WIDTH - 12, y: 12 };
    const x = Math.min(Math.max(0, position.x), Math.max(0, window.innerWidth - PANEL_WIDTH));
    const y = Math.min(Math.max(0, position.y), Math.max(0, window.innerHeight - HEADER_HEIGHT));
    this._panel.style.left = `${x}px`;
    this._panel.style.top = `${y}px`;
  }

  /**
   * Runs the command of a button of the panel.
   *
   * @param event - The click.
   */
  private _command(event: Event): void {
    const button = (event.composedPath()[0] as Element).closest?.('button[data-command]');
    switch (button?.getAttribute('data-command')) {
      case 'collapse':
        this._config.collapsed = !this._config.collapsed;
        saveConfig(this._config);
        break;
      case 'settings':
        this._settingsOpen = !this._settingsOpen;
        break;
      case 'clear':
        this._interactions.length = 0;
        this._frames.length = 0;
        break;
      case 'reset-position':
        this._config.position = null;
        saveConfig(this._config);
        break;
      case 'total':
        this._measureTotal();
        return;
      default:
        return;
    }

    this._render();
  }

  /**
   * Applies a change made in the settings.
   *
   * @param event - The change.
   */
  private _configure(event: Event): void {
    const input = event.composedPath()[0];
    if (input instanceof HTMLInputElement && input.dataset['section']) {
      this._config.sections[input.dataset['section'] as keyof TelemetryConfig['sections']] = input.checked;
    } else if (input instanceof HTMLSelectElement && input.name === 'interval') {
      this._config.interval = Number(input.value);
      this._restartTimer();
    } else if (input instanceof HTMLSelectElement && input.name === 'entries') {
      this._config.entries = Number(input.value);
    } else {
      return;
    }

    saveConfig(this._config);
    this._render();
  }

  /**
   * Draws the panel again.
   */
  private _render(): void {
    const { sections, collapsed } = this._config;
    let body = '';
    if (!collapsed) {
      body = `<div class="body">${this._settingsOpen ? this._renderSettings() : ''}${sections.startup ? this._renderStartup() : ''}${sections.interactions ? this._renderInteractions() : ''}${sections.frames ? this._renderFrames() : ''}${sections.memory ? this._renderMemory() : ''}</div>`;
    }

    this._panel.innerHTML = `
      <div class="head">
        <span class="dot"></span>
        <span class="title">Telemetry <small>· ${escape(this._framework)}</small></span>
        <button class="icon" type="button" data-command="clear" title="Clear the lists">⌫</button>
        <button class="icon" type="button" data-command="settings" title="Settings" aria-pressed="${this._settingsOpen}">⚙</button>
        <button class="icon" type="button" data-command="collapse" title="${collapsed ? 'Expand' : 'Collapse'}">${collapsed ? '▾' : '▴'}</button>
      </div>${body}`;
    this._place();
  }

  /**
   * Draws the settings.
   *
   * @returns The HTML.
   */
  private _renderSettings(): string {
    const { sections, interval, entries } = this._config;
    const check = (key: keyof TelemetryConfig['sections'], label: string): string =>
      `<label><input type="checkbox" data-section="${key}" ${sections[key] ? 'checked' : ''}>${label}</label>`;
    const options = (values: number[], current: number, format: (value: number) => string): string =>
      values.map(value => `<option value="${value}" ${value === current ? 'selected' : ''}>${format(value)}</option>`).join('');
    return `
      <div class="settings">
        <div class="checks">${check('startup', 'Startup')}${check('interactions', 'Interactions')}${check('frames', 'Long frames')}${check('memory', 'Memory')}</div>
        <label>Sampling <select name="interval">${options([500, 1000, 2000, 5000], interval, value => `${value / 1000} s`)}</select></label>
        <label>Entries listed <select name="entries">${options([5, 10, 25, 50], entries, String)}</select></label>
        <button type="button" data-command="reset-position">Reset position</button>
      </div>`;
  }

  /**
   * Draws the startup figures.
   *
   * @returns The HTML.
   */
  private _renderStartup(): string {
    return `
      <section>
        <h3>Startup</h3>
        <div class="stats">
          <div class="stat"><b>${Number.isNaN(this._firstRows) ? '…' : ms(this._firstRows)}</b><span>first rows</span></div>
          <div class="stat"><b>${Number.isNaN(this._javascript) ? '…' : size(this._javascript)}</b><span>JS downloaded</span></div>
          <div class="stat"><b>${Number.isNaN(this._elements) ? '…' : this._elements.toLocaleString('en-US')}</b><span>elements</span></div>
        </div>
      </section>`;
  }

  /**
   * Draws the interactions.
   *
   * @returns The HTML.
   */
  private _renderInteractions(): string {
    const shown = this._interactions.slice(0, this._config.entries);
    const items = shown.map(item => `<li><span class="name">${escape(item.label)}</span><span class="value ${grade(item.update)}">${ms(item.update)}</span><span class="value ${grade(item.paint)}">${ms(item.paint)}</span></li>`).join('');
    return `
      <section>
        <h3>Interactions <span class="legend">update · paint</span></h3>
        ${items ? `<ol>${items}</ol>` : '<p class="note">Click a button or type in a filter.</p>'}
      </section>`;
  }

  /**
   * Draws the long animation frames.
   *
   * @returns The HTML.
   */
  private _renderFrames(): string {
    if (!PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
      return '<section><h3>Long frames</h3><p class="note">Not reported by this browser (Chromium 123+).</p></section>';
    }

    const shown = this._frames.slice(0, this._config.entries);
    const items = shown.map(frame => `<li class="frame"><span class="value ${grade(frame.duration)}">${ms(frame.duration)}</span><span class="name" title="${escape(frame.script)}">${escape(frame.script)}</span></li>`).join('');
    return `
      <section>
        <h3>Long frames <span class="legend">over 50 ms</span></h3>
        ${items ? `<ol>${items}</ol>` : '<p class="note">None so far.</p>'}
      </section>`;
  }

  /**
   * Draws the memory, with the history of the heap.
   *
   * @returns The HTML.
   */
  private _renderMemory(): string {
    const memory = (performance as Performance & { memory?: ChromiumMemory }).memory;
    if (!memory) {
      return '<section><h3>Memory</h3><p class="note">The JavaScript heap is reported by Chromium only.</p></section>';
    }

    const max = Math.max(...this._heap);
    const min = Math.min(...this._heap);
    const span = max - min || 1;
    const points = this._heap.map((value, index) => `${(index / (HISTORY - 1)) * 100},${34 - ((value - min) / span) * 30}`).join(' ');
    const total = crossOriginIsolated
      ? `<button class="measure" type="button" data-command="total">Measure the whole page</button>${this._total ? `<p class="note">Whole page: ${escape(this._total)}</p>` : ''}`
      : '<p class="note">The memory of the whole page (DOM included) needs a cross-origin isolated page: open the example in its own tab.</p>';
    return `
      <section>
        <h3>Memory <span class="legend">JS heap</span></h3>
        <div class="stats">
          <div class="stat"><b>${size(memory.usedJSHeapSize)}</b><span>used</span></div>
          <div class="stat"><b>${size(memory.totalJSHeapSize)}</b><span>allocated</span></div>
          <div class="stat"><b>${size(max)}</b><span>peak shown</span></div>
        </div>
        <svg viewBox="0 0 100 36" preserveAspectRatio="none"><polyline points="${points}" fill="none" stroke="#7aa2ff" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>
        ${total}
      </section>`;
  }
}

/**
 * Adds the telemetry panel to the page.
 *
 * @param framework - The name of the framework of the page, shown in the header.
 */
export function mountTelemetry(framework: string): void {
  const start = (): void => new TelemetryPanel(framework).start();
  document.body ? start() : document.addEventListener('DOMContentLoaded', start, { once: true });
}
