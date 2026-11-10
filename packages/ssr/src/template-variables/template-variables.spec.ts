// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

/*
  The end-to-end specs of the variables of the templates (the ones of a @for, the @let, the parameters of a template),
  rendered in the browser: templates compiled by the compiler, rendered by the runtime of core, beside the end-to-end
  specs of the rendering on the server and of the hydration. The variables are values: a binding reading only them is
  not an effect, and runs again when its scope is refreshed.
*/
const core = await import('@xaendar/core');
const { signal } = await import('@xaendar/core/signals');
const { compile } = await import('@xaendar/compiler');
type ContextCache = import('@xaendar/compiler').ContextCache;
const { CustomElement, _Context, _defineRender } = core;

/*
  happy-dom has no moveBefore: it moves the node as insertBefore does
*/
Object.assign(Element.prototype, {
  moveBefore(this: Element, node: Node, child: Node | null) {
    Node.prototype.insertBefore.call(this, node, child);
  }
});

const helpers: Record<string, unknown> = Object.assign({}, core);

/**
 * Evaluates the code of a template, the imports of the runtime helpers given as parameters.
 */
function evaluate<Render>(code: string): Render {
  const body = `${code.split('\n').filter(line => !line.startsWith('import ')).join('\n')}\nreturn render;`;
  return new Function(...Object.keys(helpers), body)(...Object.values(helpers));
}

const cache = {
  getOrInsert: async () => ({ type: 'directive', properties: new Map() }),
  getImport: () => Promise.reject(new Error('No import')),
  set: () => undefined
} as unknown as ContextCache;

/**
 * Waits for the microtasks running the effects, and for the ones they schedule.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

let run = 0;

/**
 * The number of watchers created, one per effect.
 */
let watchers = 0;
const Watcher = Signal.subtle.Watcher;
Signal.subtle.Watcher = class extends Watcher {
  constructor(notify: () => void) {
    super(notify);
    watchers++;
  }
};

type Row = { id: number, name: string, [key: string]: unknown };

/**
 * Compiles a template, renders it in a component of a class extending `Base`, and returns the element, its shadow root
 * and the watchers its render created.
 */
async function mount<Component extends InstanceType<typeof CustomElement>>(template: string, Base: new () => Component, signals: string[]): Promise<{ element: Component, root: ShadowRoot, effects: number }> {
  const render = evaluate(await compile(template, { signals, cache }));
  const Klass = class extends (Base as unknown as typeof CustomElement) { };
  _defineRender(Klass, render as never);
  const tag = `x-variables-${run++}`;
  customElements.define(tag, Klass);
  const before = watchers;
  const element = document.createElement(tag) as unknown as Component;
  document.body.appendChild(element as unknown as Node);
  return { element, root: (element as unknown as HTMLElement).shadowRoot!, effects: watchers - before };
}

const texts = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll(selector)).map(node => node.textContent);

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('the variables of a template', () => {
  it('renders the bindings reading only variables without effects, and updates them when a row is reused for another item', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', kind: 'x' }, { id: 2, name: 'b', kind: 'y' }]);
    }
    const { element, root, effects } = await mount('@for (row of rows(); track row.id) {<p class="{row.kind}">{ row.name }</p>}', Rows, ['rows']);

    // The @for reads the signal: its rows read only their variables
    expect(effects).toBe(1);
    expect(texts(root, 'p')).toEqual(['a', 'b']);

    const before = watchers;
    element.rows.set([{ id: 1, name: 'c', kind: 'z' }, { id: 2, name: 'b', kind: 'y' }]);
    await flush();

    expect(texts(root, 'p')).toEqual(['c', 'b']);
    expect(root.querySelector('p')!.getAttribute('class')).toBe('z');
    expect(watchers).toBe(before);
  });

  it('updates a binding reading a variable and a signal of the component, when the row is reused and when the signal changes', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }]);
      public suffix = signal('!');
    }
    const { element, root, effects } = await mount('@for (row of rows(); track row.id) {<p>{ `${row.name}${suffix()}` }</p>}', Rows, ['rows', 'suffix']);
    expect(effects).toBe(2);

    element.suffix.set('?');
    await flush();
    expect(texts(root, 'p')).toEqual(['a?']);

    element.rows.set([{ id: 1, name: 'b' }]);
    await flush();
    expect(texts(root, 'p')).toEqual(['b?']);

    element.suffix.set('.');
    await flush();
    expect(texts(root, 'p')).toEqual(['b.']);
  });

  it('updates only the binding reading a signal of the component when it changes, without refreshing any scope', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
      public flag = signal('on');
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) {<p>{ row.id === 2 ? flag() : row.name }</p>}', Rows, ['rows', 'flag']);
    const refresh = vi.spyOn(_Context.prototype, 'refresh');

    element.flag.set('off');
    await flush();

    expect(texts(root, 'p')).toEqual(['a', 'off']);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('makes a binding an effect while a variable leads it to read a signal, and a plain binding again, without losing updates', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', live: false }]);
      public clock = signal(1);
    }
    const { element, root, effects } = await mount('@for (row of rows(); track row.id) {<p>{ row.live ? clock() : row.name }</p>}', Rows, ['rows', 'clock']);
    expect(effects).toBe(1);

    element.rows.set([{ id: 1, name: 'a', live: true }]);
    await flush();
    expect(texts(root, 'p')).toEqual(['1']);

    element.clock.set(2);
    await flush();
    expect(texts(root, 'p')).toEqual(['2']);

    element.rows.set([{ id: 1, name: 'b', live: false }]);
    await flush();
    expect(texts(root, 'p')).toEqual(['b']);

    element.clock.set(3);
    await flush();
    expect(texts(root, 'p')).toEqual(['b']);
  });

  it('selects again the branch of an @if and the case of a @switch, and reconciles a @for, reading a variable of the row', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', done: false, kind: 'a', tags: ['x', 'y'] }]);
    }
    const template = [
      '@for (row of rows(); track row.id) {',
      '@if (row.done) {<b>done</b>} @else {<i>todo</i>}',
      '@switch (row.kind) { @case (\'a\') {<u>A</u>} @default {<s>other</s>} }',
      '<ul>@for (tag of row.tags; track tag) {<li>{ `${tag}-${row.name}` }</li>}</ul>',
      '}'
    ].join('');
    const { element, root } = await mount(template, Rows, ['rows']);
    expect(texts(root, 'b, i, u, s')).toEqual(['todo', 'A']);
    expect(texts(root, 'li')).toEqual(['x-a', 'y-a']);

    const [x] = Array.from(root.querySelectorAll('li'));
    element.rows.set([{ id: 1, name: 'b', done: true, kind: 'c', tags: ['z', 'x'] }]);
    await flush();

    expect(texts(root, 'b, i, u, s')).toEqual(['done', 'other']);
    expect(texts(root, 'li')).toEqual(['z-b', 'x-b']);
    // The row of the tag kept is reused, updated with the variable of the enclosing row
    expect(root.querySelectorAll('li')[1]).toBe(x);
  });

  it('refreshes the content of a block reading a signal when the variable of the row it reads changes', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }]);
      public shown = signal(true);
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) {@if (shown()) {<p>{ row.name }</p>}}', Rows, ['rows', 'shown']);

    element.rows.set([{ id: 1, name: 'b' }]);
    await flush();
    expect(texts(root, 'p')).toEqual(['b']);

    element.shown.set(false);
    await flush();
    element.shown.set(true);
    await flush();
    expect(texts(root, 'p')).toEqual(['b']);
  });

  it('applies the branch of a conditional binding of a tag reading a variable of the row', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', active: false }]);
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) {<p @if (row.active) { class="on" } title="{row.name}">x</p>}', Rows, ['rows']);
    expect(root.querySelector('p')!.hasAttribute('class')).toBe(false);

    element.rows.set([{ id: 1, name: 'b', active: true }]);
    await flush();

    expect(root.querySelector('p')!.getAttribute('class')).toBe('on');
    expect(root.querySelector('p')!.getAttribute('title')).toBe('b');
  });

  it('computes a @let reading a signal, a @let reading a variable and a literal @let, and updates what reads them', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }]);
    }
    const template = [
      '@let count = rows().length;',
      '@let size = 3;',
      '@for (row of rows(); track row.id) {@let label = `${row.name}:${count}`;<p>{ label }</p>}',
      '<span>{ `${count}/${size}` }</span>'
    ].join('');
    const { element, root } = await mount(template, Rows, ['rows']);
    expect(texts(root, 'p, span')).toEqual(['a:1', '1/3']);

    element.rows.set([{ id: 1, name: 'b' }, { id: 2, name: 'c' }]);
    await flush();

    expect(texts(root, 'p, span')).toEqual(['b:2', 'c:2', '2/3']);
  });

  it('renders a template several times, updating the parameters of each instance', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
      public heading = signal('t');
    }
    const template = [
      '<template item(value: string, mark: string = \'*\')><b>{ `${value}${mark}` }</b></template>',
      '@for (row of rows(); track row.id) {@render item(row.name)}',
      '@render item(heading(), \'!\')'
    ].join('');
    const { element, root } = await mount(template, Rows, ['rows', 'heading']);
    expect(texts(root, 'b')).toEqual(['a*', 'b*', 't!']);

    const [first] = Array.from(root.querySelectorAll('b'));
    element.rows.set([{ id: 1, name: 'c' }, { id: 2, name: 'b' }]);
    element.heading.set('u');
    await flush();

    expect(texts(root, 'b')).toEqual(['c*', 'b*', 'u!']);
    expect(root.querySelector('b')).toBe(first);
  });

  it('gives an event handler the current value of a variable, after the row is reused', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }]);
      public picked = new Array<string>();

      public pick(name: string): void {
        this.picked.push(name);
      }
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) {<button (click)="pick(row.name)">x</button>}', Rows, ['rows']);

    element.rows.set([{ id: 1, name: 'b' }]);
    await flush();
    root.querySelector('button')!.click();

    expect(element.picked).toEqual(['b']);
  });

  it('fires a @defer whose when reads a variable of the row, once the row is reused with a truthy value', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', ready: false }]);
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) {@defer (when row.ready) {<b>{ row.name }</b>} @placeholder {<i>wait</i>}}', Rows, ['rows']);
    await flush();
    expect(texts(root, 'b, i')).toEqual(['wait']);

    element.rows.set([{ id: 1, name: 'b', ready: true }]);
    await flush();

    expect(texts(root, 'b, i')).toEqual(['b']);
  });
});
