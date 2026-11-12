// @vitest-environment happy-dom
import type { _Context } from '@xaendar/core';
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
const { CustomElement, _defineRender } = core;

/**
 * The scopes a scope holds, read from its slot `CHILDREN` (7): the scope itself while there is one, an array from the
 * second, told apart by the number of a scope in its slot `STATE` (2).
 */
function childrenOf(context: _Context): _Context[] {
  const children = context[7];
  return children === null ? [] : typeof children[2] === 'number' ? [children as _Context] : children as _Context[];
}

/**
 * The nodes a scope tracks, the slots from the one its layout (slot `LAYOUT`, 6) gives to the end.
 */
const nodesOf = (context: _Context): Node[] => context.slice(context[6].nodes).filter(Boolean) as Node[];


/*
  happy-dom has no moveBefore: it moves the node as insertBefore does, in an element and in a shadow root
*/
const moveBefore = {
  moveBefore(this: Node, node: Node, child: Node | null) {
    Node.prototype.insertBefore.call(this, node, child);
  }
};
Object.assign(Element.prototype, moveBefore);
Object.assign(ShadowRoot.prototype, moveBefore);

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

  it('renders the children of the elements of a row in the context of the row, updating their bindings when the row is reused for another item', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
    }
    const { element, root } = await mount('<table><tbody>@for (row of rows(); track row.id) {<tr><td><span title="{row.name}">{ row.name }</span></td></tr>}</tbody></table>', Rows, ['rows']);
    const rendered = (element as unknown as { _context: _Context })._context;
    // The rows are the only contexts inside the root: the elements of a row open none
    expect(childrenOf(rendered)).toHaveLength(2);
    for (let i = 0; i < 2; i++) {
      expect(childrenOf(childrenOf(rendered)[i])).toHaveLength(0);
      expect(nodesOf(childrenOf(rendered)[i])).toHaveLength(1);
    }

    element.rows.set([{ id: 1, name: 'c' }, { id: 2, name: 'b' }]);
    await flush();

    expect(texts(root, 'span')).toEqual(['c', 'b']);
    expect(root.querySelector('span')!.getAttribute('title')).toBe('c');
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

    element.flag.set('off');
    await flush();

    expect(texts(root, 'p')).toEqual(['a', 'off']);
    // A scope a refresh visits keeps its number in its slot `STATE` (2): none was ever refreshed
    const rendered = (element as unknown as { _context: _Context })._context;
    expect([rendered, ...childrenOf(rendered)].map(context => context[2])).toEqual([0, 0, 0]);
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

describe('the scopes of a template', () => {
  /**
   * Compiles a template and renders it without a component, into a fresh element standing for its shadow root.
   */
  async function renderAlone(template: string, component: Record<string, unknown> = {}): Promise<() => unknown> {
    const render = evaluate<(this: unknown) => unknown>(await compile(template, { signals: [], cache }));
    // Without a strategy the root scope creates its nodes, as with CREATE_NODES
    return () => render.call(Object.assign({ _root: document.createElement('div') }, component));
  }

  it('reads each variable from the nearest scope declaring it, a variable of an inner scope shadowing the one of an outer scope named alike', async () => {
    class Grid extends CustomElement {
      public outer = signal(['a', 'b']);
      public inner = signal(['x']);
    }
    const { root } = await mount('@for (item of outer(); track item) { <p>@for (item of inner(); track item) { <i>{ item }</i> }<b>{ item }</b></p> }', Grid, ['outer', 'inner']);

    expect(texts(root, 'i')).toEqual(['x', 'x']);
    expect(texts(root, 'b')).toEqual(['a', 'b']);
  });

  it('throws when a @let is read before its declaration is rendered, naming it', async () => {
    const render = await renderAlone('<p>{ total }</p>@let total = 1;');

    expect(render).toThrow(new ReferenceError('@let "total" is read before its declaration is rendered'));
  });

  it('throws when an element ref is read before its element is rendered, naming it', async () => {
    const render = await renderAlone('<p>{ field.value }</p><input #field />');

    expect(render).toThrow(new ReferenceError('Element ref "field" is read before the element it names is rendered'));
  });

  it('renders a template far from its declaration, its content reading the variables of the scope declaring it, not the ones named alike where it is rendered', async () => {
    class Page extends CustomElement {
      public show = signal(true);
      public items = signal(['a', 'b']);
    }
    const { element, root } = await mount([
      '<template row(label: string)><span>{ title } { label }</span></template>',
      '@let title = \'T\';',
      '@if (show()) { @for (title of items(); track title) { <div>@render row(title)</div> } }'
    ].join(''), Page, ['show', 'items']);

    expect(texts(root, 'span')).toEqual(['T a', 'T b']);

    element.items.set(['b', 'c']);
    await flush();

    expect(texts(root, 'span')).toEqual(['T b', 'T c']);
  });

  it('refreshes the nested @for with the index of the outer one, read through its alias, when the rows move', async () => {
    class Grid extends CustomElement {
      public rows = signal(['r', 's']);
      public cells = signal(['x', 'y']);
    }
    const { element, root } = await mount('@for (row of rows(); track row; r = $index) { <p>@for (cell of cells(); track cell) { <i>{ row }{ r }{ cell }{ $index }</i> }</p> }', Grid, ['rows', 'cells']);

    expect(texts(root, 'i')).toEqual(['r0x0', 'r0y1', 's1x0', 's1y1']);

    element.rows.set(['s', 'r']);
    await flush();

    expect(texts(root, 'i')).toEqual(['s0x0', 's0y1', 'r1x0', 'r1y1']);
  });

  it('computes a @let reading another @let again when the first one changes, by a signal or by a variable of a reused row', async () => {
    class Rows extends CustomElement {
      public count = signal(1);
      public rows = signal<Row[]>([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
    }
    const { element, root } = await mount([
      '@let double = count() * 2;@let next = double + 1;<p>{ next }</p>',
      '@for (row of rows(); track row.id) { @let name = row.name;@let label = name + \'!\';<b>{ label }</b> }'
    ].join(''), Rows, ['count', 'rows']);

    expect(texts(root, 'p')).toEqual(['3']);
    expect(texts(root, 'b')).toEqual(['a!', 'b!']);

    element.count.set(5);
    element.rows.set([{ id: 2, name: 'c' }, { id: 1, name: 'a' }]);
    await flush();

    expect(texts(root, 'p')).toEqual(['11']);
    expect(texts(root, 'b')).toEqual(['c!', 'a!']);
  });

  it('refreshes the reused rows of a @for in place, keeping their nodes and the blocks they hold, which follow the new values', async () => {
    class Rows extends CustomElement {
      public rows = signal<Row[]>([{ id: 1, name: 'a', done: false }, { id: 2, name: 'b', done: true }]);
    }
    const { element, root } = await mount('@for (row of rows(); track row.id) { <p>{ $index }:{ row.name }</p>@if (row.done) { <i>{ row.name }</i> } }', Rows, ['rows']);
    const [first, second] = Array.from(root.querySelectorAll('p'));

    element.rows.set([{ id: 2, name: 'b', done: false }, { id: 1, name: 'z', done: true }]);
    await flush();

    expect(Array.from(root.querySelectorAll('p'))).toEqual([second, first]);
    expect(texts(root, 'p')).toEqual(['0:b', '1:z']);
    expect(texts(root, 'i')).toEqual(['z']);
    // The nodes of each row stay together: its <p>, then the content of its @if before the anchor of the @if; the @for, last, has none
    expect(Array.from(root.childNodes).map(node => node.nodeName === '#comment' ? (node as Comment).data : node.textContent)).toEqual(['0:b', 'if', '1:z', 'z', 'if']);
  });
});
