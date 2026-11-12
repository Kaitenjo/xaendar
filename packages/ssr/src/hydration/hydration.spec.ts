// @vitest-environment happy-dom
import type { _Context } from '@xaendar/core';
import type { Constructor } from '@xaendar/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  // Keeps the HTMLElement and the customElements of happy-dom, which the browser side needs
  loadServerDom();
});

const core = await import('@xaendar/core');
const ssr = await import('@xaendar/ssr');
const { signal } = await import('@xaendar/core/signals');
const { compile } = await import('@xaendar/compiler');
type ContextCache = import('@xaendar/compiler').ContextCache;
const { compileServer } = await import('@xaendar/ssr-compiler');
const { CustomDirective, CustomElement, Property, StructuralDirective, _defineDirective, _defineRender } = core;
const { renderToString, _defineServerRender } = ssr;

type Component = InstanceType<typeof CustomElement>;

/**
 * The runtime helpers the code of both generators imports, given to it as parameters.
 */
const helpers: Record<string, unknown> = Object.assign({}, core, ssr);

/**
 * Evaluates the code of a template, the imports of the runtime helpers given as parameters.
 */
function evaluate<Render>(code: string): Render {
  const body = `${code.split('\n').filter(line => !line.startsWith('import ')).join('\n')}\nreturn render;`;
  return new Function(...Object.keys(helpers), body)(...Object.values(helpers));
}

/**
 * Declares an input on a component class as the accessor `@Property` decorates.
 *
 * @returns Initializes the input of an element, as the accessor does when the element is constructed: a value assigned to
 *   the element before its class was defined is written into the input.
 */
function declareInput(klass: object, name: string, value: unknown, alias?: string): (element: object) => unknown {
  const metadata = ((klass as Record<symbol, DecoratorMetadataObject | undefined>)[Symbol.for('Symbol.metadata')] ??= {});
  const storage = new WeakMap<object, unknown>();
  const target = { get(this: object) { return storage.get(this); }, set(this: object, input: unknown) { storage.set(this, input); } };
  const decorated = ((alias ? Property(value, { alias }) : Property(value)) as unknown as (target: unknown, context: unknown) => { init(this: object): unknown, set(this: object, value: unknown): void })(target, { name, metadata });
  const read = (element: object) => {
    if (!storage.has(element)) {
      storage.set(element, decorated.init.call(element));
    }
    return storage.get(element);
  };
  Object.defineProperty((klass as { prototype: object }).prototype, name, {
    get(this: object) { return read(this); },
    set(this: object, newValue: unknown) { read(this); decorated.set.call(this, newValue); }
  });
  return read;
}

/**
 * A structural directive rendering its element once a promise resolves to its `allow` input.
 */
class LaterDirective extends StructuralDirective {
  public allow = (Property(true) as unknown as (target: unknown, context: unknown) => { init(this: object): () => boolean })({}, { name: 'allow', metadata: {} }).init.call(this);

  public shouldRender(): Promise<boolean> {
    return Promise.resolve(this.allow());
  }
}
_defineDirective('later', LaterDirective);

let run = 0;
let onServer = true;

/**
 * The tag name of a component of the current test, on a side: the server renders a class defined under a tag, the
 * browser defines another class of the same component only once the HTML of the server is in the document, under the
 * tag the HTML is renamed to, as a page loading its scripts does.
 */
const tag = (side: 'server' | 'client', name: string) => `${side}-${name}-${run}`;

/**
 * The inputs of the components of the tests, by their name without the side and the run, and of the directives, by their
 * selector as applied in templates (`@@selector`): the name of the property of each input, by the name it is bound with.
 */
const testInputs: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  badge: { label: 'label' },
  counter: { start: 'start' },
  crossed: { value: 'internalValue', initialValue: 'value' },
  '@@later': { allow: 'allow' },
  '@@hydratedFill': { content: 'content' }
};

/**
 * The inputs of a component or of a directive, as the metadata of the compiler describe them.
 */
const toProperties = (inputs: Readonly<Record<string, string>> = {}) => new Map(Object.entries(inputs).map(([bound, name]) => [bound, { name, type: 'unknown', required: false, exposed: false }]));

/**
 * The cache of the metadata the browser compiles the templates with: it tells the inputs of `testInputs`, and no module
 * declaring a component or a directive, so a `@hydrate` loads nothing before rendering its content. Every tag is
 * described as a directive, the only metadata naming no module.
 */
const emptyCache = {
  getOrInsert: async (selector: string) => ({ type: 'directive', properties: toProperties(testInputs[selector.startsWith('@@') ? selector : selector.replace(/^client-(.*)-\d+$/, '$1')]) }),
  getImport: () => Promise.reject(new Error('No import')),
  set: () => undefined
} as unknown as ContextCache;

/**
 * Compiles a template for the server, importing the components and the directives of `testInputs`, as the template of an
 * application imports the ones it renders: the server generator reads their inputs from the imports.
 */
async function compileForServer(template: string, options: Pick<Parameters<typeof compileServer>[1], 'signals' | 'islands'>): Promise<string> {
  const names = Object.keys(testInputs);
  const imports = names.map(name => name.startsWith('@@')
    ? { type: 'directive', selector: name.slice(2), properties: toProperties(testInputs[name]) }
    : { type: 'component', selector: tag('server', name), properties: toProperties(testInputs[name]) });
  const cache = { getImport: async (imported: string) => imports[Number(imported.slice('Imported'.length))] } as unknown as ContextCache;
  return compileServer(`@import { ${names.map((_, index) => `Imported${index}`).join(', ')} } from './imported'${template}`, { ...options, templateDir: '/', cache });
}

/**
 * Compiles a template with both generators, and registers a class of the component for each side.
 */
async function register(name: string, Base: Constructor<Component>, template: (tag: (name: string) => string) => string, signals: string[] = [], css?: string, cache = emptyCache): Promise<{ Server: Constructor<Component>, define: () => void }> {
  const Server = class extends Base { };
  customElements.define(tag('server', name), Server);
  _defineServerRender(Server, evaluate(await compileForServer(template(child => tag('server', child)), { signals })), css);

  const Client = class extends Base { };
  let styleSheet: CSSStyleSheet | undefined;
  if (css) {
    styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
  }
  _defineRender(Client, evaluate(await compile(template(child => tag('client', child)), { signals, cache })), styleSheet);
  return { Server, define: () => customElements.define(tag('client', name), Client) };
}

/**
 * Puts the HTML of the server in the document, as the parser does: the declarative shadow roots, which happy-dom does not
 * build, are attached to their hosts.
 */
function load(html: string): Element {
  document.body.innerHTML = html.replaceAll('server-', 'client-');
  attachDeclarativeShadowRoots(document.body);
  return document.body.firstElementChild!;
}

/**
 * Attaches the declarative shadow roots of a tree, and the ones of their content.
 */
function attachDeclarativeShadowRoots(root: ParentNode): void {
  const templates = root.querySelectorAll('template[shadowrootmode]');
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i] as HTMLTemplateElement;
    const shadowRoot = template.parentElement!.attachShadow({ mode: 'open' });
    shadowRoot.append(template.content);
    template.remove();
    attachDeclarativeShadowRoots(shadowRoot);
  }
}

/**
 * Records the mutations of trees from now on.
 */
function observe(...roots: Node[]): () => MutationRecord[] {
  const observer = new MutationObserver(() => undefined);
  for (let i = 0; i < roots.length; i++) {
    observer.observe(roots[i], { childList: true, subtree: true, attributes: true, characterData: true });
  }

  return () => observer.takeRecords();
}

/**
 * Lists what mutations removed and added: the text of the comments removed, the `<style>` the server writes, and the empty
 * texts added, the only nodes the server cannot render. Fails when a mutation does anything else.
 */
function describeMutations(records: MutationRecord[]): { removed: string[], added: number } {
  const removed = new Array<string>();
  let added = 0;
  for (let i = 0; i < records.length; i++) {
    const { type, addedNodes, removedNodes } = records[i];
    expect(type).toBe('childList');
    for (let j = 0; j < addedNodes.length; j++) {
      expect(addedNodes[j].nodeType).toBe(Node.TEXT_NODE);
      expect(addedNodes[j].textContent).toBe('');
      added++;
    }

    for (let j = 0; j < removedNodes.length; j++) {
      const node = removedNodes[j];
      node.nodeType === Node.COMMENT_NODE ? removed.push((node as Comment).data) : removed.push(`<${(node as Element).localName}>`);
    }
  }

  return { removed, added };
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * A badge, rendered by the other components, recording the label its `onInit` reads.
 */
class Badge extends CustomElement {
  public static readonly seen = new Array<string>();
  public declare label: () => string;

  constructor() {
    super();
    initLabel(this);
  }

  public onInit(): void {
    Badge.seen.push(this.label());
  }
}
const initLabel = declareInput(Badge, 'label', '');

/**
 * The cache of the metadata the browser compiles the templates rendering the badge with, which tells its inputs.
 */
const badgeCache = {
  getOrInsert: async () => ({ type: 'component', properties: new Map([['label', { name: 'label', type: 'string', required: false, exposed: false }]]) }),
  getImport: () => Promise.reject(new Error('No import')),
  set: () => undefined
} as unknown as ContextCache;

/**
 * Registers the badge of the current test.
 */
const registerBadge = () => register('badge', Badge, () => '<span>{ label() }</span><slot></slot>', ['label'], ':host { display: block }');

beforeEach(() => {
  run++;
  onServer = true;
  Badge.seen.length = 0;
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('hydration', () => {
  /**
   * A team rendering every construct of a template.
   */
  class Team extends CustomElement {
    public users = signal([{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }]);
    public kind = signal('b');
    public count = signal(1);
    public empty = '';
    public clicks = 0;

    public select(): void {
      this.clicks++;
    }
  }

  const teamTemplate = (tag: (name: string) => string) => [
    '<h1 class="title" [class.long]="{ users().length > 1 }">Hello { users()[0].name }!</h1>',
    '<template row(text: string)><em>{ text }</em></template>',
    '@if (users().length) {',
    `@for (user of users(); track user.id) {<${tag('badge')} label="{ user.name }">#{ $index }</${tag('badge')}>}`,
    '} @else {<p>Nobody</p>}',
    '@switch (kind()) { @case (\'a\') {<i>a</i>} @default {<i>{ count() }</i>} }',
    '<button (click)="select()">{ empty }</button>',
    '<b *later(allow="{ true }")>late</b>',
    'tail @render row(\'x\')'
  ].join('');

  it('adopts every node the server rendered, removing only its markers, and keeps the nodes reactive', async () => {
    const badge = await registerBadge();
    const team = await register('team', Team, teamTemplate, ['users', 'kind', 'count']);
    const host = load(await renderToString(team.Server));
    Badge.seen.length = 0;
    const root = host.shadowRoot!;
    const heading = root.querySelector('h1')!;
    const texts = Array.from(heading.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
    const badges = Array.from(root.querySelectorAll(tag('client', 'badge')));
    const label = badges[0].shadowRoot!.querySelector('span')!.lastChild;
    const records = observe(root, badges[0].shadowRoot!, badges[1].shadowRoot!);

    badge.define();
    team.define();

    expect(root.querySelector('h1')).toBe(heading);
    expect(Array.from(heading.childNodes)).toEqual(texts);
    expect(Array.from(root.querySelectorAll(tag('client', 'badge')))).toEqual(badges);
    expect(badges[0].shadowRoot!.querySelector('span')!.lastChild).toBe(label);
    // The empty interpolation of the button has no text node in the HTML: it is the only node created
    const { removed, added } = describeMutations(records());
    expect(added).toBe(1);
    expect(removed.sort()).toEqual(['', '', '', '', '', '', '', '', '', '', '<style>', '<style>', 'xd-for', 'xd-if:0', 'xd-item:n1', 'xd-item:n2', 'xd-s:1', 'xd-switch:1']);
    expect(console.warn).not.toHaveBeenCalled();
    expect(Badge.seen).toEqual(['Ada', 'Bob']);
    expect(root.innerHTML).toBe([
      '<h1 class="title long">Hello Ada!</h1>',
      `<${tag('client', 'badge')}>#0</${tag('client', 'badge')}><${tag('client', 'badge')}>#1</${tag('client', 'badge')}><!--/xd-for--><!--/xd-if-->`,
      '<i>1</i><!--/xd-switch-->',
      '<button></button>',
      '<b>late</b><!--/xd-s-->',
      'tail <em>x</em>'
    ].join(''));

    const team1 = host as Team;
    team1.users.set([{ id: 2, name: 'Bob' }]);
    team1.count.set(2);
    (root.querySelector('button') as HTMLButtonElement).click();
    await flush();

    expect(heading.textContent).toBe('Hello Bob!');
    expect(heading.className).toBe('title');
    expect(root.querySelectorAll(tag('client', 'badge'))).toHaveLength(1);
    expect(root.querySelector(tag('client', 'badge'))).toBe(badges[1]);
    expect(root.querySelector('i')!.textContent).toBe('2');
    expect(team1.clicks).toBe(1);
  });

  it('creates what the blocks render after the hydration, at any depth', async () => {
    /**
     * A list showing the details of its items on demand.
     */
    class Details extends CustomElement {
      public items = signal(['a']);
      public open = signal(false);
    }
    const details = await register('details', Details, () => [
      '<section>@for (item of items(); track item) {<p>@if (open()) {<b>{ item }</b>}</p>}</section>',
      '<i *later(allow="{ open() }")>late</i>'
    ].join(''), ['items', 'open']);
    const host = load(await renderToString(details.Server));
    const root = host.shadowRoot!;
    const row = root.querySelector('p');

    details.define();
    (host as Details).open.set(true);
    (host as Details).items.set(['a', 'b']);
    await flush();

    expect(root.querySelector('p')).toBe(row);
    expect(Array.from(root.querySelectorAll('b')).map(element => element.textContent)).toEqual(['a', 'b']);
    expect(root.querySelector('i')!.textContent).toBe('late');
    expect(console.warn).not.toHaveBeenCalled();
  });


  it('removes the style the server wrote, adopting the stylesheet of the component', async () => {
    const badge = await registerBadge();
    const host = load(await renderToString(badge.Server));

    badge.define();

    expect(host.shadowRoot!.querySelector('style')).toBeNull();
    expect(host.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  });

  it('adopts an element whose content a custom directive assigned on the server, the directive assigning it in the browser only in its effect', async () => {
    const assigned = new Array<string>();

    /**
     * A directive filling its element with the HTML of its input: in `onInit` on the server, in an effect in the browser.
     */
    class HydratedFillDirective extends CustomDirective {
      public content = (Property('') as unknown as (target: unknown, context: unknown) => { init(this: object): () => string })({}, { name: 'content', metadata: {} }).init.call(this);

      public onInit(): void {
        if (onServer) {
          this.element.innerHTML = this.content();
        }

        this.effect(() => {
          assigned.push(this.content());
          this.element.innerHTML = this.content();
        });
      }
    }
    _defineDirective('hydratedFill', HydratedFillDirective);

    /**
     * A card whose paragraph the directive fills.
     */
    class Card extends CustomElement {
      public html = '<b>bold</b> text';
    }
    const card = await register('card', Card, () => '<p @@hydratedFill(content="{ html }")></p><footer>end</footer>');
    const host = load(await renderToString(card.Server));
    const root = host.shadowRoot!;
    const paragraph = root.querySelector('p')!;
    const footer = root.querySelector('footer');

    expect(paragraph.innerHTML).toBe('<b>bold</b> text');

    onServer = false;
    card.define();

    expect(root.querySelector('p')).toBe(paragraph);
    expect(root.querySelector('footer')).toBe(footer);
    expect(paragraph.innerHTML).toBe('<b>bold</b> text');
    expect(assigned).toEqual(['<b>bold</b> text']);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('renders again a block the server rendered with another branch, with a warning, adopting the rest', async () => {
    /**
     * A panel showing another branch in the browser.
     */
    class Panel extends CustomElement {
      public open = signal(onServer);
    }
    const panel = await register('panel', Panel, () => '<h2>Panel</h2>@if (open()) {<p>open</p>} @else {<p>closed</p>}<footer>end</footer>', ['open']);
    const host = load(await renderToString(panel.Server));
    const root = host.shadowRoot!;
    const heading = root.querySelector('h2');
    const footer = root.querySelector('footer');

    onServer = false;
    panel.define();

    expect(root.innerHTML).toBe('<h2>Panel</h2><p>closed</p><!--/xd-if--><footer>end</footer>');
    expect(root.querySelector('h2')).toBe(heading);
    expect(root.querySelector('footer')).toBe(footer);
    expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'panel')}> <!--xd-if:0--> where the browser renders <!--xd-if:1-->, which it renders again`);
  });

  it('renders again the items of a @for whose keys the server rendered differently, with a warning', async () => {
    /**
     * A list with other items in the browser.
     */
    class List extends CustomElement {
      public items = signal(onServer ? ['a', 'b'] : ['b', 'c']);
    }
    const list = await register('list', List, () => '<ul>@for (item of items(); track item) {<li>{ item }</li>}</ul>', ['items']);
    const host = load(await renderToString(list.Server));
    const items = Array.from(host.shadowRoot!.querySelectorAll('li'));

    onServer = false;
    list.define();

    const rendered = Array.from(host.shadowRoot!.querySelectorAll('li'));
    expect(rendered.map(item => item.textContent)).toEqual(['b', 'c']);
    expect(rendered).not.toContain(items[1]);
    expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'list')}> other items in a <!--xd-for--> than the browser renders, which it renders again`);
  });

  it('adopts the items of a @for reading some of its variables by their aliases, then moves them, updating the variables in place', async () => {
    /**
     * A list whose items repeat a key.
     */
    class Rows extends CustomElement {
      public rows = signal([{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 1, name: 'c' }]);
    }
    const rows = await register('rows', Rows, () => '<ul>@for (row of rows(); track row.id; i = $index, last = $last) {<li>{ i }:{ row.name }@if (last) {!}</li>}</ul>', ['rows']);
    const host = load(await renderToString(rows.Server));
    const [first, second, third] = Array.from(host.shadowRoot!.querySelectorAll('li'));

    onServer = false;
    rows.define();
    const component = host as unknown as Rows;

    expect(Array.from(host.shadowRoot!.querySelectorAll('li'))).toEqual([first, second, third]);
    expect([first, second, third].map(item => item.textContent)).toEqual(['0:a', '1:b', '2:c!']);

    // happy-dom has no moveBefore: it moves the node as insertBefore does
    Object.assign(Element.prototype, { moveBefore: Node.prototype.insertBefore });
    component.rows.set([{ id: 2, name: 'b' }, { id: 1, name: 'a2' }, { id: 1, name: 'c' }]);
    await flush();

    expect(Array.from(host.shadowRoot!.querySelectorAll('li'))).toEqual([second, first, third]);
    expect([second, first, third].map(item => item.textContent)).toEqual(['0:b', '1:a2', '2:c!']);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('adopts without writing them the nodes of the bindings reading only variables of the template, then updates them when a row is reused', async () => {
    /**
     * A list whose rows read their variables through a @let, a block and a template.
     */
    class Board extends CustomElement {
      public rows = signal([{ id: 1, name: 'a', done: false }, { id: 2, name: 'b', done: true }]);
    }
    const board = await register('board', Board, () => [
      '<template cell(value: string)><em>{ value }</em></template>',
      '<ul>@for (row of rows(); track row.id) {@let label = `${row.name}!`;<li title="{label}">{ label }@if (row.done) {<b>done</b>}@render cell(row.name)</li>}</ul>'
    ].join(''), ['rows']);
    const host = load(await renderToString(board.Server));
    const root = host.shadowRoot!;
    const items = Array.from(root.querySelectorAll('li'));
    const records = observe(root);

    onServer = false;
    board.define();

    // Only the markers of the server are removed: no text and no attribute is written
    expect(Array.from(root.querySelectorAll('li'))).toEqual(items);
    expect(describeMutations(records()).added).toBe(0);
    expect(items.map(item => [item.getAttribute('title'), item.textContent])).toEqual([['a!', 'a!a'], ['b!', 'b!doneb']]);
    expect(console.warn).not.toHaveBeenCalled();

    (host as unknown as Board).rows.set([{ id: 1, name: 'c', done: true }, { id: 2, name: 'b', done: true }]);
    await flush();

    expect(Array.from(root.querySelectorAll('li'))).toEqual(items);
    expect(items.map(item => [item.getAttribute('title'), item.textContent])).toEqual([['c!', 'c!donec'], ['b!', 'b!doneb']]);
  });

  it('keeps the element of an asynchronous structural directive the server rendered until its outcome settles', async () => {
    /**
     * A notice the browser hides once its outcome settles.
     */
    class Notice extends CustomElement {
      public shown = signal(onServer);
    }
    const notice = await register('notice', Notice, () => '<b *later(allow="{ shown() }")>notice</b>', ['shown']);
    const host = load(await renderToString(notice.Server));
    const element = host.shadowRoot!.querySelector('b');

    onServer = false;
    notice.define();

    expect(host.shadowRoot!.querySelector('b')).toBe(element);

    await flush();

    expect(host.shadowRoot!.querySelector('b')).toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('creates an element the server did not render where the browser renders it, with a warning, and removes what is left', async () => {
    const card = await register('card', class extends CustomElement { }, () => '<p>a</p><p>b</p>');
    const host = load(await renderToString(card.Server));
    const root = host.shadowRoot!;
    root.firstChild!.replaceWith(document.createElement('div'));

    card.define();

    expect(root.innerHTML).toBe('<p>a</p><p>b</p>');
    expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'card')}> <div> where the browser renders <p>, which it creates`);
  });

  it('keeps the value of a field the user edited before the page hydrated', async () => {
    /**
     * A form whose field the user edits before the scripts load.
     */
    class Form extends CustomElement {
      public name = signal('Ada');
    }
    const form = await register('form', Form, () => '<input value="{ name() }" />', ['name']);
    const host = load(await renderToString(form.Server));
    const field = host.shadowRoot!.querySelector('input')!;
    field.value = 'Grace';

    form.define();

    expect(host.shadowRoot!.querySelector('input')).toBe(field);
    expect(field.value).toBe('Grace');
  });

  it('leaves out on the server the attributes bound to null or undefined, as the browser does, which adopts them without writing', async () => {
    /**
     * A hint shown in the title of two elements only while there is one, the second one toggling a class.
     */
    class Hint extends CustomElement {
      public hint = signal<string | null>(null);
      public missing = undefined;
    }
    const hint = await register('hint', Hint, () => '<p title="{ hint() }" data-note="{ missing }">p</p><b title="{ hint() }" [class.on]="{ hint() }">b</b>', ['hint']);
    const html = await renderToString(hint.Server);
    const host = load(html);
    const root = host.shadowRoot!;
    const records = observe(root);

    expect(html).toContain('<p>p</p><b>b</b>');

    onServer = false;
    hint.define();

    expect(describeMutations(records()).added).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();

    (host as unknown as Hint).hint.set('more');
    await flush();
    expect(Array.from(root.querySelectorAll('p, b')).map(element => element.getAttribute('title'))).toEqual(['more', 'more']);

    (host as unknown as Hint).hint.set(null);
    await flush();
    expect(Array.from(root.querySelectorAll('p, b')).map(element => element.hasAttribute('title'))).toEqual([false, false]);
  });

  it('hydrates a component whose class is defined after the component rendering it, once it is defined', async () => {
    /**
     * A card rendering a badge, whose class the browser defines later.
     */
    class Card extends CustomElement { }
    const badge = await registerBadge();
    const card = await register('card', Card, tag => `<${tag('badge')} label="Lazy"></${tag('badge')}>`);
    const host = load(await renderToString(card.Server));
    Badge.seen.length = 0;
    const element = host.shadowRoot!.firstElementChild!;
    const label = element.shadowRoot!.querySelector('span')!.lastChild;

    card.define();

    expect(Badge.seen).toEqual([]);

    badge.define();

    expect(host.shadowRoot!.firstElementChild).toBe(element);
    expect(element.shadowRoot!.querySelector('span')!.lastChild).toBe(label);
    expect(Badge.seen).toHaveLength(1);
  });

  it('sets the inputs of a component whose class is not defined yet as its properties, which it reads once defined', async () => {
    /**
     * A card rendering a badge, whose class the browser defines later.
     */
    class Card extends CustomElement {
      public name = signal('Ada');
    }
    const badge = await registerBadge();
    const card = await register('card', Card, tag => `<${tag('badge')} label="{ name() }"></${tag('badge')}>`, ['name'], undefined, badgeCache);
    const host = load(await renderToString(card.Server));
    Badge.seen.length = 0;
    const element = host.shadowRoot!.firstElementChild!;

    card.define();
    badge.define();

    expect(host.shadowRoot!.firstElementChild).toBe(element);
    expect(Badge.seen).toEqual(['Ada']);
    expect(element.hasAttribute('label')).toBe(false);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['before', true],
    ['after', false]
  ])('sets the inputs declaring an alias by the name of their property, one named like the alias of the other, its class defined %s the component rendering it', async (_when, first) => {
    /**
     * A component whose input named `value` is bound as `initialValue`, the alias `value` naming another one.
     */
    class Crossed extends CustomElement {
      public declare internalValue: () => string;
      public declare value: () => string;

      constructor() {
        super();
        initInternalValue(this);
        initValue(this);
      }
    }
    const initInternalValue = declareInput(Crossed, 'internalValue', '', 'value');
    const initValue = declareInput(Crossed, 'value', '', 'initialValue');

    /**
     * A card rendering the component.
     */
    class Card extends CustomElement {
      public text = signal('b');
    }
    const crossed = await register('crossed', Crossed, () => '<i>{ internalValue() }</i><b>{ value() }</b>', ['internalValue', 'value']);
    const card = await register('card', Card, tag => `<${tag('crossed')} value="a" initialValue="{ text() }"></${tag('crossed')}>`, ['text']);
    const host = load(await renderToString(card.Server));
    const element = host.shadowRoot!.firstElementChild! as Crossed;
    expect(element.shadowRoot!.innerHTML).toBe('<i><!---->a</i><b><!---->b</b>');

    if (first) {
      crossed.define();
      card.define();
    } else {
      card.define();
      crossed.define();
    }

    expect(element.internalValue()).toBe('a');
    expect(element.value()).toBe('b');
    expect(element.hasAttribute('value')).toBe(false);
    expect(element.hasAttribute('initialValue')).toBe(false);

    (host as Card).text.set('c');
    await flush();

    expect(element.value()).toBe('c');
    expect(element.internalValue()).toBe('a');
    expect(element.shadowRoot!.innerHTML).toBe('<i>a</i><b>c</b>');
    expect(console.warn).not.toHaveBeenCalled();
  });

  describe('the last block of its parent', () => {
    /**
     * A shelf whose blocks are the last nodes of their elements, but the one of the paragraph.
     */
    class Shelf extends CustomElement {
      public show = signal(true);
      public kind = signal('a');
      public items = signal(['a', 'b', 'c']);
      public rows = signal([{ id: 1, on: true }, { id: 2, on: false }]);
    }

    const shelfTemplate = () => [
      '<section>@if (show()) {<b>yes</b>@switch (kind()) { @case (\'a\') {<i>a</i>} @default {<i>other</i>} }} @else {<s>no</s>}</section>',
      '<ul>@for (item of items(); track item) {<li>{ item }</li>}</ul>',
      '<ol>@for (row of rows(); track row.id) {<li><span>@if (row.on) {<b>on</b>} @else {<s>off</s>}</span></li>}</ol>',
      '<p>@if (show()) {<i>a</i>} tail</p>'
    ].join('');

    /**
     * Lists the comments left in a tree.
     */
    const comments = (root: Node) => {
      const found = new Array<string>();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        found.push((node as Comment).data);
      }

      return found;
    };

    it('is written without closing marker, adopted without anchor and without warnings, and renders its updates where it is', async () => {
      const shelf = await register('shelf', Shelf, shelfTemplate, ['show', 'kind', 'items', 'rows']);
      const html = await renderToString(shelf.Server);
      const host = load(html) as Shelf;
      const root = host.shadowRoot!;

      expect(html).toContain('<section><!--xd-if:0--><b>yes</b><!--xd-switch:0--><i>a</i></section>');
      expect(html).not.toContain('<!--/xd-for-->');
      expect(html).toContain('<span><!--xd-if:1--><s>off</s></span>');
      expect(html).toContain('<p><!--xd-if:0--><i>a</i><!--/xd-if--> tail</p>');

      shelf.define();
      const [a, b, c] = Array.from(root.querySelectorAll('ul > li'));
      const [first, second] = Array.from(root.querySelectorAll('ol > li'));

      expect(console.warn).not.toHaveBeenCalled();
      // The block of the paragraph, followed by a text, keeps its anchor
      expect(comments(root)).toEqual(['/xd-if']);
      expect(root.innerHTML).toBe('<section><b>yes</b><i>a</i></section><ul><li>a</li><li>b</li><li>c</li></ul><ol><li><span><b>on</b></span></li><li><span><s>off</s></span></li></ol><p><i>a</i><!--/xd-if--> tail</p>');

      host.kind.set('z');
      await flush();
      expect(root.querySelector('section')!.innerHTML).toBe('<b>yes</b><i>other</i>');

      host.show.set(false);
      await flush();
      expect(root.querySelector('section')!.innerHTML).toBe('<s>no</s>');
      expect(root.querySelector('p')!.innerHTML).toBe('<!--/xd-if--> tail');

      host.show.set(true);
      await flush();
      expect(root.querySelector('section')!.innerHTML).toBe('<b>yes</b><i>other</i>');
      expect(root.querySelector('p')!.innerHTML).toBe('<i>a</i><!--/xd-if--> tail');

      // happy-dom has no moveBefore: it moves the node as insertBefore does
      Object.assign(Element.prototype, { moveBefore: Node.prototype.insertBefore });
      host.items.set(['c', 'a', 'd']);
      await flush();
      const items = Array.from(root.querySelectorAll('ul > li'));
      expect(items.map(item => item.textContent)).toEqual(['c', 'a', 'd']);
      expect(items[0]).toBe(c);
      expect(items[1]).toBe(a);
      expect(items).not.toContain(b);

      host.items.set([]);
      await flush();
      expect(root.querySelector('ul')!.innerHTML).toBe('');
      host.items.set(['x', 'y']);
      await flush();
      expect(root.querySelector('ul')!.innerHTML).toBe('<li>x</li><li>y</li>');

      // The rows move with the block of their cell, which has no anchor of its own
      host.rows.set([{ id: 2, on: true }, { id: 1, on: false }]);
      await flush();
      const rows = Array.from(root.querySelectorAll('ol > li'));
      expect(rows).toEqual([second, first]);
      expect(root.querySelector('ol')!.innerHTML).toBe('<li><span><b>on</b></span></li><li><span><s>off</s></span></li>');
      expect(comments(root)).toEqual(['/xd-if']);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('has no anchor in a page rendered in the browser either', async () => {
      const shelf = await register('shelf', Shelf, shelfTemplate, ['show', 'kind', 'items', 'rows']);
      shelf.define();

      const host = document.body.appendChild(document.createElement(tag('client', 'shelf'))) as Shelf;

      expect(host.shadowRoot!.innerHTML).toBe('<section><b>yes</b><i>a</i></section><ul><li>a</li><li>b</li><li>c</li></ul><ol><li><span><b>on</b></span></li><li><span><s>off</s></span></li></ol><p><i>a</i><!--if--> tail</p>');
      host.show.set(false);
      await flush();
      expect(host.shadowRoot!.querySelector('section')!.innerHTML).toBe('<s>no</s>');
    });

    /**
     * Widgets whose every block is the last node of its element.
     */
    class Widgets extends CustomElement {
      public hits = signal(0);
      public allow = signal(true);

      public risky(): string {
        return 'ok';
      }

      public hit(): void {
        this.hits.update(hits => hits + 1);
      }
    }

    const widgetsTemplate = () => [
      '<div>@try {<b>{ risky() }</b>} @catch (error) {<i>{ error.message }</i>}</div>',
      '<div>@defer (interaction) {<b>content</b>} @placeholder {<button>load</button>}</div>',
      '<div>@hydrate (interaction) {<button (click)="hit()">{ hits() }</button>}</div>',
      '<div>@client {<b>client</b>} @placeholder {<i>wait</i>}</div>',
      '<div><b *later(allow="{ allow() }")>late</b></div>'
    ].join('');

    it('closes no @try, @defer, @hydrate, @client and structural element with a marker, and adopts them without anchor', async () => {
      const widgets = await register('widgets', Widgets, widgetsTemplate, ['hits', 'allow']);
      const html = await renderToString(widgets.Server);
      const host = load(html) as Widgets;
      const root = host.shadowRoot!;
      const [, deferred, hydrated, , structural] = Array.from(root.children);

      expect(html).not.toMatch(/<!--\/xd-/);
      const button = hydrated.querySelector('button')!;

      widgets.define();
      await flush();

      expect(console.warn).not.toHaveBeenCalled();
      // The content of the @hydrate, inert until its trigger fires, keeps the separator of its text
      expect(root.innerHTML).toBe('<div><b>ok</b></div><div><button>load</button></div><div><button><!---->0</button></div><div><b>client</b></div><div><b>late</b></div>');

      deferred.querySelector('button')!.click();
      expect(deferred.innerHTML).toBe('<b>content</b>');

      button.click();
      expect(hydrated.querySelector('button')).toBe(button);
      expect(host.hits()).toBe(1);
      await flush();
      expect(hydrated.innerHTML).toBe('<button>1</button>');

      host.allow.set(false);
      await flush();
      expect(structural.innerHTML).toBe('');
      host.allow.set(true);
      await flush();
      expect(structural.innerHTML).toBe('<b>late</b>');
      expect(comments(root)).toEqual([]);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('@hydrate', () => {
    /**
     * A shop whose buying part hydrates at the first interaction.
     */
    class Shop extends CustomElement {
      public bought = 0;
      public open = signal(false);

      public buy(): void {
        this.bought++;
      }
    }

    const shopTemplate = (tag: (name: string) => string) => [
      '<h2>Shop</h2>',
      `@hydrate (interaction) {<button (click)="buy()">Buy</button><${tag('badge')} label="Sale"></${tag('badge')}>@if (open()) {<p>Open</p>}}`,
      '<footer>end</footer>'
    ].join('');

    it('leaves the content the server rendered inert, then adopts it at the first interaction, which it replays', async () => {
      const badge = await registerBadge();
      const shop = await register('shop', Shop, shopTemplate, ['open']);
      const host = load(await renderToString(shop.Server));
      Badge.seen.length = 0;
      const root = host.shadowRoot!;
      const button = root.querySelector('button')!;
      const element = root.querySelector(tag('client', 'badge'))!;

      badge.define();
      shop.define();

      expect(Badge.seen).toEqual([]);
      button.click();

      expect(root.querySelector('button')).toBe(button);
      expect(root.querySelector(tag('client', 'badge'))).toBe(element);
      expect(Badge.seen).toEqual(['Sale']);
      expect((host as Shop).bought).toBe(1);
      expect(root.innerHTML).toBe(`<h2>Shop</h2><button>Buy</button><${tag('client', 'badge')}></${tag('client', 'badge')}><!--/xd-if--><!--/xd-h--><footer>end</footer>`);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders, once hydrated, what the state changed while it waited, without warnings', async () => {
      const badge = await registerBadge();
      const shop = await register('shop', Shop, shopTemplate, ['open']);
      const host = load(await renderToString(shop.Server));
      const root = host.shadowRoot!;

      badge.define();
      shop.define();
      (host as Shop).open.set(true);
      await flush();
      expect(root.querySelector('p')).toBeNull();
      root.querySelector('button')!.click();

      expect(root.querySelector('p')!.textContent).toBe('Open');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders the content at once in a page rendered in the browser, whatever its triggers', async () => {
      const badge = await registerBadge();
      const shop = await register('shop', Shop, shopTemplate, ['open']);
      badge.define();
      shop.define();
      const host = document.body.appendChild(document.createElement(tag('client', 'shop')));

      expect(host.shadowRoot!.innerHTML).toBe(`<h2>Shop</h2><button>Buy</button><${tag('client', 'badge')}></${tag('client', 'badge')}><!--if--><!--hydrate--><footer>end</footer>`);
      expect(Badge.seen).toEqual(['Sale']);
    });

    it('leaves the content of a @hydrate (never) as the HTML of the server, its component not defined and its links working', async () => {
      const shop = await register('shop', Shop, name => `<h2>Shop</h2>@hydrate (never) {<a href="#x" (click)="buy()">Buy</a><${name('badge')} label="Sale"></${name('badge')}>}<footer>end</footer>`);
      const badge = await registerBadge();
      const host = load(await renderToString(shop.Server));
      Badge.seen.length = 0;
      const root = host.shadowRoot!;
      const link = root.querySelector('a')!;
      const html = root.innerHTML;

      shop.define();
      const clicks = vi.fn((event: Event) => event.preventDefault());
      root.addEventListener('click', clicks);
      link.click();
      await flush();

      // As any block, it consumes its opening marker
      expect(root.innerHTML).toBe(html.replace('<!--xd-h-->', ''));
      expect(root.querySelector('a')).toBe(link);
      expect(clicks).toHaveBeenCalledOnce();
      expect((host as Shop).bought).toBe(0);
      expect(customElements.get(tag('client', 'badge'))).toBeUndefined();
      expect(console.warn).not.toHaveBeenCalled();

      badge.define();

      expect(Badge.seen).toEqual([]);
    });

    it('renders the content of a @hydrate (never) in a page rendered in the browser', async () => {
      const shop = await register('shop', Shop, () => '@hydrate (never) {<button (click)="buy()">Buy</button>}');
      shop.define();

      const host = document.body.appendChild(document.createElement(tag('client', 'shop'))) as unknown as Shop;
      host.shadowRoot!.querySelector('button')!.click();

      expect(host.bought).toBe(1);
    });
  });

  describe('@try', () => {
    /**
     * A profile whose city cannot be read on the sides `failOn` lists.
     */
    class Profile extends CustomElement {
      public static failOn: Array<'server' | 'client'> = [];
      public clicks = 0;
      public failing = Profile.failOn.includes(onServer ? 'server' : 'client');

      public city(): string {
        if (this.failing) {
          throw new Error(onServer ? 'Server failed' : 'Browser failed');
        }

        return 'Rome';
      }

      public add(): void {
        this.clicks++;
      }
    }

    const profileTemplate = () => '<h2>Profile</h2>@try {<p>{ city() }</p><button (click)="add()">Add</button>} @catch (error) {<i>{ error.message }</i>}<footer>end</footer>';

    /**
     * Renders the profile on the server, then defines it in the browser, failing on the sides given.
     */
    const hydrateProfile = async (...failOn: Array<'server' | 'client'>) => {
      Profile.failOn = failOn;
      const profile = await register('profile', Profile, profileTemplate);
      const html = await renderToString(profile.Server);
      const host = load(html) as Profile;
      const root = host.shadowRoot!;
      const server = { heading: root.querySelector('h2'), footer: root.querySelector('footer'), p: root.querySelector('p'), i: root.querySelector('i') };
      onServer = false;
      profile.define();
      return { html, host, root, server };
    };

    it('adopts the content the server rendered, its listeners bound to its nodes', async () => {
      const { html, host, root, server } = await hydrateProfile();

      expect(html).toContain('<!--xd-t:0--><p><!---->Rome</p><button>Add</button><!--/xd-t-->');
      expect(root.innerHTML).toBe('<h2>Profile</h2><p>Rome</p><button>Add</button><!--/xd-t--><footer>end</footer>');
      expect(root.querySelector('p')).toBe(server.p);
      root.querySelector('button')!.click();
      expect(host.clicks).toBe(1);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders the @catch when the content throws in the browser only, with a warning, adopting what surrounds the block', async () => {
      const { root, server } = await hydrateProfile('client');

      expect(root.innerHTML).toBe('<h2>Profile</h2><i>Browser failed</i><!--/xd-t--><footer>end</footer>');
      expect(root.querySelector('h2')).toBe(server.heading);
      expect(root.querySelector('footer')).toBe(server.footer);
      expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'profile')}> <!--xd-t:0--> where the browser renders <!--xd-t:1-->, which it renders again`);
    });

    it('renders the content again from scratch, without warnings, where the server rendered the @catch, whose error does not reach the browser', async () => {
      const { html, host, root, server } = await hydrateProfile('server');

      expect(html).toContain('<!--xd-t:1--><i><!---->Server failed</i><!--/xd-t-->');
      expect(root.innerHTML).toBe('<h2>Profile</h2><p>Rome</p><button>Add</button><!--/xd-t--><footer>end</footer>');
      expect(root.querySelector('footer')).toBe(server.footer);
      root.querySelector('button')!.click();
      expect(host.clicks).toBe(1);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('creates the @catch again, with the error of the browser, where both sides throw', async () => {
      const { root, server } = await hydrateProfile('server', 'client');

      expect(root.innerHTML).toBe('<h2>Profile</h2><i>Browser failed</i><!--/xd-t--><footer>end</footer>');
      expect(root.querySelector('i')).not.toBe(server.i);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders the @catch in a page rendered in the browser when the content throws', async () => {
      Profile.failOn = ['client'];
      onServer = false;
      const profile = await register('profile', Profile, profileTemplate);
      profile.define();

      const host = document.body.appendChild(document.createElement(tag('client', 'profile')));

      expect(host.shadowRoot!.innerHTML).toBe('<h2>Profile</h2><i>Browser failed</i><!--try--><footer>end</footer>');
    });

    describe('a child component', () => {
      /**
       * A card throwing in the hook `failIn` names, on the sides `failOn` lists, counting the times it is destroyed.
       */
      class Card extends CustomElement {
        public static failIn: 'constructor' | 'onInit' | 'render' = 'onInit';
        public static failOn: Array<'server' | 'client'> = [];
        public static destroyed = 0;

        constructor() {
          super();
          Card.fail('constructor');
        }

        public onInit(): void {
          Card.fail('onInit');
        }

        public static fail(hook: typeof Card.failIn): void {
          if (Card.failIn === hook && Card.failOn.includes(onServer ? 'server' : 'client')) {
            throw new Error(`${hook} failed on the ${onServer ? 'server' : 'browser'}`);
          }
        }

        public heading(): string {
          Card.fail('render');
          return 'Card';
        }

        public onDestroy(): void {
          Card.destroyed++;
        }
      }

      /**
       * A card rendering without errors, counted with the cards destroyed.
       */
      class Fine extends CustomElement {
        public onDestroy(): void {
          Card.destroyed++;
        }
      }

      /**
       * Registers a page rendering in a @try a card rendering without errors, then a card throwing as given.
       */
      const registerCards = async (failIn: typeof Card.failIn, ...failOn: Array<'server' | 'client'>) => {
        Object.assign(Card, { failIn, failOn, destroyed: 0 });
        const fine = await register('fine', Fine, () => '<u>Fine</u>');
        const card = await register('card', Card, () => '<b>{ heading() }</b>');
        const page = await register('page', CustomElement, name => `<h2>Cards</h2>@try {<${name('fine')} /><${name('card')} />} @catch (error) {<i>{ error.message }</i>}<footer>end</footer>`);
        return { page, define: () => { fine.define(); card.define(); page.define(); } };
      };

      it('catches the error of its onInit thrown in the browser only, with a warning, removing the components the content rendered', async () => {
        const { page, define } = await registerCards('onInit', 'client');
        const html = await renderToString(page.Server);
        const root = load(html).shadowRoot!;
        const footer = root.querySelector('footer');
        onServer = false;

        define();

        expect(html).toContain('<!--xd-t:0-->');
        expect(root.innerHTML).toBe('<h2>Cards</h2><i>onInit failed on the browser</i><!--/xd-t--><footer>end</footer>');
        expect(root.querySelector('footer')).toBe(footer);
        expect(Card.destroyed).toBe(2);
        expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'page')}> <!--xd-t:0--> where the browser renders <!--xd-t:1-->, which it renders again`);
      });

      it('catches the error of its constructor on both sides, the browser creating the @catch again without warnings', async () => {
        const { page, define } = await registerCards('constructor', 'server', 'client');
        const html = await renderToString(page.Server);
        const root = load(html).shadowRoot!;
        onServer = false;

        define();

        expect(html).toContain('<!--xd-t:1--><i><!---->constructor failed on the server</i><!--/xd-t-->');
        expect(root.innerHTML).toBe('<h2>Cards</h2><i>constructor failed on the browser</i><!--/xd-t--><footer>end</footer>');
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('catches the error of its first render in a page rendered in the browser, disposing what it rendered', async () => {
        const { define } = await registerCards('render', 'client');
        onServer = false;
        define();

        const host = document.body.appendChild(document.createElement(tag('client', 'page')));

        expect(host.shadowRoot!.innerHTML).toBe('<h2>Cards</h2><i>render failed on the browser</i><!--try--><footer>end</footer>');
        expect(Card.destroyed).toBe(2);
      });

      it('catches the error of its constructor in a page rendered in the browser', async () => {
        const { define } = await registerCards('constructor', 'client');
        onServer = false;
        define();

        const host = document.body.appendChild(document.createElement(tag('client', 'page')));

        expect(host.shadowRoot!.innerHTML).toBe('<h2>Cards</h2><i>constructor failed on the browser</i><!--try--><footer>end</footer>');
        expect(Card.destroyed).toBe(1);
      });
    });
  });

  describe('@client', () => {
    /**
     * An alert whose button exists only in the browser, recording what `afterRender` finds.
     */
    class Alert extends CustomElement {
      public rings = 0;
      public open = signal(true);
      public found: Element | null = null;

      public afterRender(): void {
        this.found = this.shadowRoot!.querySelector('button');
      }

      public ring(): void {
        this.rings++;
      }
    }

    const alertTemplate = () => '<h2>Alert</h2>@client {<button (click)="ring()">Ring</button>} @placeholder {<p>Wait</p>text}<footer>end</footer>';

    it('writes only its markers and its placeholder on the server, not the code of the content', async () => {
      const alert = await register('alert', Alert, alertTemplate);
      const noPlaceholder = await register('bare', Alert, () => '<h2>Bare</h2>@client {<button></button>}');

      expect(await renderToString(alert.Server)).toContain('<h2>Alert</h2><!--xd-c--><p>Wait</p>text<!--/xd-c--><footer>end</footer>');
      // The last node of the shadow root has no closing marker
      expect(await renderToString(noPlaceholder.Server)).toContain('<h2>Bare</h2><!--xd-c--></template>');
    });

    it('creates the content while the component hydrates, in place of the placeholder, adopting what surrounds it without warnings', async () => {
      const alert = await register('alert', Alert, alertTemplate);
      const host = load(await renderToString(alert.Server)) as Alert;
      const root = host.shadowRoot!;
      const heading = root.querySelector('h2');
      const footer = root.querySelector('footer');

      alert.define();

      expect(root.innerHTML).toBe('<h2>Alert</h2><button>Ring</button><!--/xd-c--><footer>end</footer>');
      expect(root.querySelector('h2')).toBe(heading);
      expect(root.querySelector('footer')).toBe(footer);
      expect(host.found).toBe(root.querySelector('button'));
      expect(console.warn).not.toHaveBeenCalled();

      root.querySelector('button')!.click();

      expect(host.rings).toBe(1);
    });

    it('renders the content at once in a page rendered in the browser, never its placeholder', async () => {
      const alert = await register('alert', Alert, alertTemplate);
      alert.define();

      const host = document.body.appendChild(document.createElement(tag('client', 'alert')));

      expect(host.shadowRoot!.innerHTML).toBe('<h2>Alert</h2><button>Ring</button><!--client--><footer>end</footer>');
    });

    it('creates the content in a block rendered again, as any other part of it', async () => {
      const alert = await register('alert', Alert, () => '@if (open()) {@client {<button>Ring</button>} @placeholder {<p>Wait</p>}}', ['open']);
      const host = load(await renderToString(alert.Server)) as Alert;
      const root = host.shadowRoot!;
      alert.define();
      expect(root.innerHTML).toBe('<button>Ring</button>');

      host.open.set(false);
      await flush();
      expect(root.querySelector('button')).toBeNull();

      host.open.set(true);
      await flush();

      expect(root.querySelector('button')).not.toBeNull();
      expect(root.querySelector('p')).toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('keeps the placeholder until the @hydrate holding it hydrates', async () => {
      const alert = await register('alert', Alert, () => '@hydrate (interaction) {<div>@client {<button>Ring</button>} @placeholder {<p>Wait</p>}</div>}');
      const host = load(await renderToString(alert.Server));
      const root = host.shadowRoot!;

      alert.define();
      expect(root.querySelector('p')).not.toBeNull();
      expect(root.querySelector('button')).toBeNull();

      root.querySelector('div')!.click();

      expect(root.querySelector('p')).toBeNull();
      expect(root.querySelector('button')).not.toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('keeps the placeholder until the trigger of the component holding it fires', async () => {
      class Waiting extends Alert { }
      Object.defineProperty(Waiting, Symbol.for('Symbol.metadata'), { value: { hydrate: 'interaction' } });
      const alert = await register('waiting', Waiting, () => '<div>@client {<button>Ring</button>} @placeholder {<p>Wait</p>}</div>');
      const host = load(await renderToString(alert.Server));
      const root = host.shadowRoot!;

      alert.define();
      expect(root.querySelector('p')).not.toBeNull();

      root.querySelector('div')!.click();

      expect(root.querySelector('p')).toBeNull();
      expect(root.querySelector('button')).not.toBeNull();
    });

    it('removes a component of the placeholder without running its hooks, even if its class is defined', async () => {
      const onDestroy = vi.fn();
      class Spinner extends CustomElement {
        public onDestroy = onDestroy;
      }
      const spinner = await register('spinner', Spinner, () => '<i>…</i>');
      const alert = await register('alert', Alert, name => `@client {<button>Ring</button>} @placeholder {<${name('spinner')}></${name('spinner')}>}`);
      const host = load(await renderToString(alert.Server));
      const element = host.shadowRoot!.querySelector(tag('client', 'spinner'))!;
      expect(element.shadowRoot!.innerHTML).toContain('<i>');

      spinner.define();
      alert.define();

      expect(element.isConnected).toBe(false);
      expect(host.shadowRoot!.querySelector('button')).not.toBeNull();
      expect(onDestroy).not.toHaveBeenCalled();
    });
  });

  describe('@defer', () => {
    /**
     * Comments shown once asked for, counting the times they are asked for.
     */
    class Comments extends CustomElement {
      public asked = 0;
      public count = signal(3);

      public ask(): void {
        this.asked++;
      }
    }

    const commentsTemplate = () => '<h2>Post</h2>@defer (interaction) {<ul><li>{ count() } comments</li></ul>} @placeholder {<button (click)="ask()">Show</button>} @loading {<i>Loading</i>}<footer>end</footer>';

    it('adopts the @placeholder the server rendered, its listeners bound, and creates the content at an interaction on it', async () => {
      const comments = await register('comments', Comments, commentsTemplate, ['count']);
      const html = await renderToString(comments.Server);
      const host = load(html) as Comments;
      const root = host.shadowRoot!;
      const button = root.querySelector('button')!;
      const footer = root.querySelector('footer');
      onServer = false;

      comments.define();
      expect(root.querySelector('button')).toBe(button);
      // The triggers are armed once the code rendering the block is done
      await flush();
      button.click();

      expect(html).toContain('<h2>Post</h2><!--xd-d--><button>Show</button><!--/xd-d--><footer>end</footer>');
      expect(host.asked).toBe(1);
      expect(root.innerHTML).toBe('<h2>Post</h2><ul><li>3 comments</li></ul><!--/xd-d--><footer>end</footer>');
      expect(root.querySelector('footer')).toBe(footer);
      host.count.set(4);
      await flush();
      expect(root.querySelector('li')!.textContent).toBe('4 comments');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders the @placeholder, then the content, in a page rendered in the browser', async () => {
      onServer = false;
      const comments = await register('comments', Comments, commentsTemplate, ['count']);
      comments.define();

      const host = document.body.appendChild(document.createElement(tag('client', 'comments')));
      expect(host.shadowRoot!.innerHTML).toBe('<h2>Post</h2><button>Show</button><!--defer--><footer>end</footer>');
      await flush();
      host.shadowRoot!.querySelector('button')!.click();

      expect(host.shadowRoot!.innerHTML).toBe('<h2>Post</h2><ul><li>3 comments</li></ul><!--defer--><footer>end</footer>');
    });
  });

  describe('static components', () => {
    /**
     * An interactive component a static one renders, with an input.
     */
    class Counter extends CustomElement {
      public declare start: () => number;
      public clicks = signal(0);

      constructor() {
        super();
        initStart(this);
      }

      public add(): void {
        this.clicks.set(this.clicks() + 1);
      }
    }
    const initStart = declareInput(Counter, 'start', 0);

    /**
     * Compiles a static page for the server only, and renders it: the browser never gets its class.
     */
    async function renderStatic(name: string, template: (tag: (name: string) => string) => string, islands: string[]): Promise<Element> {
      const Static = class extends CustomElement { };
      customElements.define(tag('server', name), Static);
      _defineServerRender(Static, evaluate(await compileForServer(template(child => tag('server', child)), { signals: [], islands: new Set(islands.map(island => tag('server', island))) })));
      return load(await renderToString(Static));
    }

    it('leaves the static component as it is, the interactive one hydrating by itself from its inputs', async () => {
      const counter = await register('counter', Counter, () => '<button (click)="add()">{ start() + clicks() }</button>', ['start', 'clicks']);
      const host = await renderStatic('shell', name => `<p>Static</p><${name('counter')} start="{ 5 }"></${name('counter')}>`, ['counter']);
      const element = host.shadowRoot!.querySelector(tag('client', 'counter'))!;
      const button = element.shadowRoot!.querySelector('button')!;
      const paragraph = host.shadowRoot!.querySelector('p');

      counter.define();

      expect(customElements.get(tag('client', 'shell'))).toBeUndefined();
      expect(host.shadowRoot!.querySelector('p')).toBe(paragraph);
      expect(element.hasAttribute('data-xd-inputs')).toBe(false);
      expect(button.textContent).toBe('5');

      button.click();
      await flush();

      expect(element.shadowRoot!.querySelector('button')).toBe(button);
      expect(button.textContent).toBe('6');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('waits for the trigger of an interactive component a static one renders', async () => {
      class Waiting extends Counter { }
      Object.defineProperty(Waiting, Symbol.for('Symbol.metadata'), { value: { hydrate: 'interaction' } });
      const counter = await register('waiting', Waiting, () => '<button (click)="add()">{ clicks() }</button>', ['clicks']);
      const host = await renderStatic('shell', name => `<${name('waiting')}></${name('waiting')}>`, ['waiting']);
      const element = host.shadowRoot!.firstElementChild!;
      const button = element.shadowRoot!.querySelector('button')!;

      counter.define();
      expect((element as Waiting).clicks()).toBe(0);
      button.click();
      await flush();

      expect(button.textContent).toBe('1');
    });

    it('adopts a static component without a class in an interactive one, its light DOM included', async () => {
      const Static = class extends CustomElement { };
      customElements.define(tag('server', 'card'), Static);
      _defineServerRender(Static, evaluate(await compileForServer('<i>Card</i><slot></slot>', { signals: [] })));
      class Parent extends CustomElement {
        public clicks = 0;

        public add(): void {
          this.clicks++;
        }
      }
      const parent = await register('parent', Parent, name => `<${name('card')}><button (click)="add()">Add</button></${name('card')}>`);
      const host = load(await renderToString(parent.Server)) as Parent;
      const card = host.shadowRoot!.firstElementChild!;
      const button = card.querySelector('button')!;

      parent.define();
      button.click();

      expect(host.shadowRoot!.firstElementChild).toBe(card);
      expect(card.querySelector('button')).toBe(button);
      expect(card.shadowRoot!.innerHTML).toContain('<i>Card</i>');
      expect(host.clicks).toBe(1);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  it('waits for the trigger the @WebComponent of a component declares, replaying the events recorded meanwhile', async () => {
    /**
     * A toggle hydrating at the first interaction.
     */
    class Toggle extends CustomElement {
      public on = signal(false);

      public toggle(): void {
        this.on.set(!this.on());
      }
    }
    Object.defineProperty(Toggle, Symbol.for('Symbol.metadata'), { value: { hydrate: 'interaction' } });
    const toggle = await register('toggle', Toggle, () => '<button (click)="toggle()">{ on() ? \'on\' : \'off\' }</button>', ['on']);
    const page = await register('page', class extends CustomElement { }, tag => `<${tag('toggle')}></${tag('toggle')}>`);
    const host = load(await renderToString(page.Server));
    const element = host.shadowRoot!.firstElementChild!;
    const button = element.shadowRoot!.querySelector('button')!;

    expect(element.getAttribute('data-xd-hydrate')).toBe('interaction');
    toggle.define();
    page.define();
    await flush();
    expect(button.textContent).toBe('off');
    button.click();
    await flush();

    expect(element.shadowRoot!.querySelector('button')).toBe(button);
    expect(button.textContent).toBe('on');
    expect(element.hasAttribute('data-xd-hydrate')).toBe(false);
    expect(console.warn).not.toHaveBeenCalled();
  });

  describe('a component declaring render: false', () => {
    /**
     * A component only the browser renders, recording the input its `onInit` finds.
     */
    class Chart extends CustomElement {
      public static seen = new Array<number>();
      public declare center: () => number;

      constructor() {
        super();
        initCenter(this);
      }

      public onInit(): void {
        Chart.seen.push(this.center());
      }
    }
    const initCenter = declareInput(Chart, 'center', 0);

    /**
     * The cache of the metadata the browser compiles the templates rendering the chart with, which tells its inputs.
     */
    const chartCache = {
      getOrInsert: async () => ({ type: 'component', properties: new Map([['center', { name: 'center', type: 'number', required: false, exposed: false }]]) }),
      getImport: () => Promise.reject(new Error('No import')),
      set: () => undefined
    } as unknown as ContextCache;

    /**
     * Compiles for the server a template importing the chart, whose class the server never gets.
     */
    async function defineOnServer(name: string, template: string, islands: string[], hydrate?: string): Promise<Constructor<Component>> {
      const Server = class extends CustomElement { };
      customElements.define(tag('server', name), Server);
      const getImport = async () => ({
        type: 'component',
        selector: tag('server', 'chart'),
        properties: new Map([['center', { name: 'center', exposed: false }]]),
        clientOnly: hydrate ? { hydrate } : {}
      });
      _defineServerRender(Server, evaluate(await compileServer(`@import { Chart } from './chart.ts';\n${template}`, { signals: [], templateDir: '/src', islands: new Set(islands), cache: { getImport } as unknown as ContextCache })));
      return Server;
    }

    /**
     * Compiles the class of the chart for the browser.
     *
     * @returns Defines it.
     */
    async function registerChart(): Promise<() => void> {
      const Client = class extends Chart { };
      _defineRender(Client, evaluate(await compile('<i>{ center() }</i><slot></slot>', { signals: ['center'], cache: emptyCache })));
      return () => customElements.define(tag('client', 'chart'), Client);
    }

    /**
     * A page holding the chart, with both sides compiled.
     */
    async function registerPage(hydrate?: string): Promise<{ html: string, define: () => void }> {
      const page = (name: string) => `<${name} title="Map" center="{ 5 }"><a>Source</a></${name}>`;
      const Server = await defineOnServer('page', page(tag('server', 'chart')), [], hydrate);
      const Client = class extends CustomElement { };
      _defineRender(Client, evaluate(await compile(page(tag('client', 'chart')), { signals: [], cache: chartCache })));
      return { html: await renderToString(Server), define: () => customElements.define(tag('client', 'page'), Client) };
    }

    beforeEach(() => {
      Chart.seen.length = 0;
    });

    it('writes its element empty on the server, without its class, then renders it in the browser with the inputs of the template holding it', async () => {
      const page = await registerPage();
      const defineChart = await registerChart();

      expect(customElements.get(tag('server', 'chart'))).toBeUndefined();
      expect(page.html).toContain(`<${tag('server', 'chart')} title="Map" data-xd-client=""><a>Source</a></${tag('server', 'chart')}>`);

      const host = load(page.html);
      const element = host.shadowRoot!.firstElementChild!;
      const link = element.querySelector('a');

      defineChart();
      expect(Chart.seen).toEqual([]);
      page.define();

      expect(Chart.seen).toEqual([5]);
      expect(element.shadowRoot!.innerHTML).toContain('<i>5</i>');
      expect(element.hasAttribute('data-xd-client')).toBe(false);
      expect(host.shadowRoot!.firstElementChild).toBe(element);
      expect(element.querySelector('a')).toBe(link);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders by itself from data-xd-inputs in a static template', async () => {
      const Server = await defineOnServer('shell', `<${tag('server', 'chart')} center="{ 8 }"></${tag('server', 'chart')}>`, [tag('server', 'chart')]);
      const defineChart = await registerChart();
      const host = load(await renderToString(Server));
      const element = host.shadowRoot!.firstElementChild!;

      expect(element.hasAttribute('data-xd-inputs')).toBe(true);
      defineChart();

      expect(Chart.seen).toEqual([8]);
      expect(element.hasAttribute('data-xd-inputs')).toBe(false);
      expect(element.shadowRoot!.innerHTML).toContain('<i>8</i>');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('renders as the root of a page from the inputs of renderToString', async () => {
      class Root extends Chart { }
      Object.defineProperty(Root, Symbol.for('Symbol.metadata'), { value: { render: false } });
      customElements.define(tag('server', 'chart'), Root);
      const defineChart = await registerChart();
      const host = load(await renderToString(Root, { center: 7 } as never));

      expect(host.shadowRoot).toBeNull();
      defineChart();

      expect(Chart.seen).toEqual([7]);
      expect(host.shadowRoot!.innerHTML).toContain('<i>7</i>');
    });

    it('waits for its trigger, then renders with the inputs of the template holding it', async () => {
      const page = await registerPage('interaction');
      const defineChart = await registerChart();
      const host = load(page.html);
      const element = host.shadowRoot!.firstElementChild as HTMLElement;

      expect(element.getAttribute('data-xd-hydrate')).toBe('interaction');
      defineChart();
      page.define();
      expect(Chart.seen).toEqual([]);

      element.click();

      expect(Chart.seen).toEqual([5]);
      expect(element.shadowRoot!.innerHTML).toContain('<i>5</i>');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('the event contract', () => {
    /**
     * A counter, recording the order of what it handles.
     */
    class Counter extends CustomElement {
      public clicks = signal(0);
      public log = new Array<string>();

      public add(): void {
        this.clicks.set(this.clicks() + 1);
        this.log.push('add');
      }

      public note(value: string): void {
        this.log.push(value);
      }
    }

    /**
     * Runs on the page the script `renderToString` writes, as the parser does.
     */
    function runContract(html: string): Element {
      const host = load(html);
      const script = /<script>(\(.*?)<\/script>/s.exec(html)![1].replace('document.currentScript.previousElementSibling', 'root');
      new Function('root', script)(host);
      return host;
    }

    afterEach(() => {
      delete window[core._EVENT_CONTRACT_KEY];
    });

    it('replays what the user did before the runtime was there, without warnings', async () => {
      const counter = await register('counter', Counter, () => '<button (click)="add()">{ clicks() }</button><input (change)="note(\'changed\')" />', ['clicks']);
      const host = runContract(await renderToString(counter.Server)) as Counter;
      const button = host.shadowRoot!.querySelector('button')!;

      button.click();
      button.click();
      host.shadowRoot!.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }));
      counter.define();
      await flush();

      expect(host.log).toEqual(['add', 'add', 'changed']);
      expect(button.textContent).toBe('2');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('replays an event once, the listeners of the page alone handling what follows', async () => {
      const counter = await register('counter', Counter, () => '<button (click)="add()">{ clicks() }</button>', ['clicks']);
      const host = runContract(await renderToString(counter.Server)) as Counter;
      const button = host.shadowRoot!.querySelector('button')!;

      button.click();
      counter.define();
      await flush();
      button.click();
      await flush();

      expect(host.log).toEqual(['add', 'add']);
    });

    it('fires the interaction trigger of a @hydrate for an event of the contract, which a block without listeners needs too', async () => {
      const page = await register('page', Counter, () => '@hydrate (interaction) {<p>{ clicks() }</p>}', ['clicks']);
      const host = runContract(await renderToString(page.Server)) as Counter;
      const paragraph = host.shadowRoot!.querySelector('p')!;

      paragraph.click();
      page.define();
      host.clicks.set(4);
      await flush();

      expect(paragraph.textContent).toBe('4');
      expect(host.shadowRoot!.querySelector('p')).toBe(paragraph);
    });

    it('fires the interaction trigger of a @defer for an event of the contract on its @placeholder, which has no listeners', async () => {
      const page = await register('page', Counter, () => '@defer (interaction) {<p>{ clicks() }</p>} @placeholder {<button>Show</button>}', ['clicks']);
      const host = runContract(await renderToString(page.Server)) as Counter;

      host.shadowRoot!.querySelector('button')!.click();
      page.define();
      await flush();

      expect(host.shadowRoot!.innerHTML).toBe('<p>0</p>');
    });

    it('fires the interaction trigger of a component, adopted by its parent, replaying the event', async () => {
      class Waiting extends Counter { }
      Object.defineProperty(Waiting, Symbol.for('Symbol.metadata'), { value: { hydrate: 'interaction' } });
      const waiting = await register('waiting', Waiting, () => '<button (click)="add()">{ clicks() }</button>', ['clicks']);
      const page = await register('page', class extends CustomElement { }, name => `<${name('waiting')}></${name('waiting')}>`);
      const host = runContract(await renderToString(page.Server));
      const element = host.shadowRoot!.firstElementChild as Waiting;

      element.shadowRoot!.querySelector('button')!.click();
      waiting.define();
      page.define();
      await flush();

      expect(element.log).toEqual(['add']);
      expect(element.hasAttribute('data-xd-hydrate')).toBe(false);
    });

    it('drops the event of a node the hydration replaced', async () => {
      const counter = await register('counter', Counter, () => '<button (click)="add()">{ clicks() }</button>', ['clicks']);
      const host = runContract(await renderToString(counter.Server)) as Counter;
      const button = host.shadowRoot!.querySelector('button')!;
      const paragraph = host.ownerDocument.createElement('p');
      button.replaceWith(paragraph);
      paragraph.click();

      counter.define();
      await flush();

      expect(host.log).toEqual([]);
    });

    it('replays an event in a component that never hydrates to what surrounds it', async () => {
      class Frozen extends CustomElement { }
      Object.defineProperty(Frozen, Symbol.for('Symbol.metadata'), { value: { hydrate: 'never' } });
      const frozen = await register('frozen', Frozen, () => '<i>Frozen</i>');
      const page = await register('page', Counter, name => `<div (click)="add()"><${name('frozen')}></${name('frozen')}></div>`);
      const host = runContract(await renderToString(page.Server)) as Counter;

      host.shadowRoot!.querySelector(tag('client', 'frozen'))!.shadowRoot!.querySelector('i')!.click();
      frozen.define();
      page.define();
      await flush();

      expect(host.log).toEqual(['add']);
    });
  });

  describe('a component declaring hydrate: never', () => {
    /**
     * A component that never hydrates, recording its hook.
     */
    class Frozen extends CustomElement {
      public static inits = 0;
      public clicks = 0;

      public onInit(): void {
        Frozen.inits++;
      }

      public add(): void {
        this.clicks++;
      }
    }
    Object.defineProperty(Frozen, Symbol.for('Symbol.metadata'), { value: { hydrate: 'never' } });

    /**
     * A parent counting the clicks on the light DOM of the component.
     */
    class Parent extends CustomElement {
      public clicks = 0;

      public add(): void {
        this.clicks++;
      }
    }

    beforeEach(() => {
      Frozen.inits = 0;
    });

    it('stays the HTML of the server, while the parent adopts its element and its light DOM', async () => {
      const frozen = await register('frozen', Frozen, () => '<button (click)="add()">Add</button><slot></slot>');
      const parent = await register('parent', Parent, name => `<${name('frozen')}><a (click)="add()">Add</a></${name('frozen')}>`);
      const host = load(await renderToString(parent.Server)) as Parent;
      Frozen.inits = 0;
      const element = host.shadowRoot!.firstElementChild!;
      const button = element.shadowRoot!.querySelector('button')!;
      const link = element.querySelector('a')!;

      expect(element.getAttribute('data-xd-hydrate')).toBe('never');
      frozen.define();
      parent.define();
      button.click();
      link.click();
      await flush();

      expect(Frozen.inits).toBe(0);
      expect((element as Frozen).clicks).toBe(0);
      expect(host.clicks).toBe(1);
      expect(host.shadowRoot!.firstElementChild).toBe(element);
      expect(element.shadowRoot!.querySelector('button')).toBe(button);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('stays the HTML of the server as the root of a page', async () => {
      const frozen = await register('frozen', Frozen, () => '<button (click)="add()">Add</button>');
      const host = load(await renderToString(frozen.Server)) as Frozen;
      Frozen.inits = 0;

      frozen.define();
      host.shadowRoot!.querySelector('button')!.click();
      await flush();

      expect(Frozen.inits).toBe(0);
      expect(host.clicks).toBe(0);
    });

    it('hydrates in the content of a @hydrate that hydrates, the template deciding for that instance', async () => {
      const frozen = await register('frozen', Frozen, () => '<i>Frozen</i>');
      const parent = await register('parent', Parent, name => `@hydrate (interaction) {<button (click)="add()">Add</button><${name('frozen')}></${name('frozen')}>}`);
      const host = load(await renderToString(parent.Server)) as Parent;
      Frozen.inits = 0;

      frozen.define();
      parent.define();
      host.shadowRoot!.querySelector('button')!.click();
      await flush();

      expect(host.clicks).toBe(1);
      expect(Frozen.inits).toBe(1);
      expect(host.shadowRoot!.querySelector(tag('client', 'frozen'))!.hasAttribute('data-xd-hydrate')).toBe(false);
    });

    it('renders when the browser creates it', async () => {
      const frozen = await register('frozen', Frozen, () => '<i>Frozen</i>');
      frozen.define();

      const element = document.body.appendChild(document.createElement(tag('client', 'frozen')));

      expect(element.shadowRoot!.innerHTML).toBe('<i>Frozen</i>');
      expect(Frozen.inits).toBe(1);
    });
  });
});

describe('the contexts of the elements', () => {
  type Context = _Context;

  /**
   * The scopes a scope holds in its containers, the slots from the one its layout (slot `LAYOUT`, 6) gives to the end:
   * a scope, `null`, or the run of a `@for`, holding the scopes of its rows.
   */
  function childrenOf(context: _Context): _Context[] {
    const children = new Array<_Context>();
    for (let i = context[6].containers ?? context.length; i < context.length; i++) {
      const container = context[i] as _Context | { rows: _Context[] | null } | null;
      if (Array.isArray(container)) {
        children.push(container);
      } else if (container?.rows) {
        children.push(...container.rows);
      }
    }

    return children;
  }

  /**
   * The nodes a scope tracks, the slots from the one its layout (slot `LAYOUT`, 6) gives to its first container.
   */
  const nodesOf = (context: _Context): Node[] => context.slice(context[6].nodes, context[6].containers).filter(Boolean) as Node[];

  /**
   * A table of rows and columns, every cell an element reading its row.
   */
  class Grid extends CustomElement {
    public rows = signal([{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }, { id: 3, a: 'a3', b: 'b3' }]);
    public cols = signal(['a', 'b']);
    public open = signal(true);
  }

  // happy-dom has no moveBefore, which a @for moves its items with: it moves them as insertBefore does
  beforeEach(() => {
    Object.assign(Element.prototype, { moveBefore: Element.prototype.insertBefore });
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Record<'moveBefore', unknown>>).moveBefore;
  });

  const gridTemplate = () => '<section>@for (row of rows(); track row.id) {<p>@for (col of cols(); track col) {<span>{ row[col] }@if (open()) {<i>!</i>}</span>}</p>}</section>';

  /**
   * The contexts of a tree, each one with the nodes it tracks.
   */
  function collect(context: Context, contexts = new Array<Context>()): Context[] {
    contexts.push(context);
    const children = childrenOf(context);
    for (let i = 0; i < children.length; i++) {
      collect(children[i], contexts);
    }

    return contexts;
  }

  /**
   * Checks that every context tracks only the nodes at the top of its block, all in the same node, and returns them.
   */
  function trackedNodes(host: Element): Node[] {
    const nodes = new Array<Node>();
    const contexts = collect((host as unknown as { _context: Context })._context);
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      const own = nodesOf(context);
      for (let j = 0; j < own.length; j++) {
        expect(own[j].parentNode).toBe(own[0].parentNode);
        nodes.push(own[j]);
      }
    }

    return nodes;
  }

  /**
   * The texts of the cells, by row.
   */
  const cells = (root: ShadowRoot) => Array.from(root.querySelectorAll('p')).map(row => Array.from(row.querySelectorAll('span')).map(cell => cell.textContent));

  it('renders the children of an element in its context, tracking only the nodes at the top of the blocks, which the @for moves and removes', async () => {
    const grid = await register('grid', Grid, gridTemplate, ['rows', 'cols', 'open']);
    grid.define();
    const host = document.body.appendChild(document.createElement(tag('client', 'grid'))) as unknown as Grid & Element;
    const root = host.shadowRoot!;

    // The three rows, the six cells and the <i> of each cell: the root context keeps none of its nodes, as the section
    expect(trackedNodes(host).map(node => (node as Element).localName)).toEqual(['p', 'span', 'i', 'span', 'i', 'p', 'span', 'i', 'span', 'i', 'p', 'span', 'i', 'span', 'i']);
    const [first, second, third] = Array.from(root.querySelectorAll('p'));

    host.rows.set([host.rows()[2], host.rows()[0]]);
    host.open.set(false);
    await flush();

    expect(Array.from(root.querySelectorAll('p'))).toEqual([third, first]);
    expect(second.isConnected).toBe(false);
    expect(cells(root)).toEqual([['a3', 'b3'], ['a1', 'b1']]);
    expect(root.querySelectorAll('i')).toHaveLength(0);

    host.rows.set([{ id: 3, a: 'x3', b: 'y3' }]);
    host.open.set(true);
    await flush();

    expect(cells(root)).toEqual([['x3!', 'y3!']]);
    expect(trackedNodes(host)).toHaveLength(5);
  });

  it('adopts the children of the elements in their contexts, and renders in a context of their own the children of an element created in place of a node of the server', async () => {
    const grid = await register('grid', Grid, gridTemplate, ['rows', 'cols', 'open']);
    const host = load(await renderToString(grid.Server)) as unknown as Grid & Element;
    const root = host.shadowRoot!;
    const firstCell = root.querySelector('span')!;
    // The browser creates the second cell of the first row, whose content the server wrote in another element
    const replaced = root.querySelectorAll('span')[1];
    const other = document.createElement('b');
    other.append(...replaced.childNodes);
    replaced.replaceWith(other);

    grid.define();

    expect(root.querySelector('span')).toBe(firstCell);
    expect(console.warn).toHaveBeenCalled();
    expect(cells(root)).toEqual([['a1!', 'b1!'], ['a2!', 'b2!'], ['a3!', 'b3!']]);
    trackedNodes(host);

    host.open.set(false);
    host.rows.set([{ id: 1, a: 'x1', b: 'y1' }]);
    await flush();

    expect(cells(root)).toEqual([['x1', 'y1']]);
    expect(root.querySelector('span')).toBe(firstCell);
    expect(root.querySelectorAll('i')).toHaveLength(0);
  });

  /**
   * A panel whose element applying a structural directive renders a @for, holding an @if, without declaring names.
   */
  class Panel extends CustomElement {
    public allow = signal(true);
    public items = signal(['a', 'b']);
    public flag = signal(true);
  }

  const panelTemplate = () => '<div *later(allow="{ allow() }")><b>x</b>@for (item of items(); track item) {<i>{ item }</i>@if (flag()) {<u>{ item }</u>}}</div><p>end</p>';

  it('adopts the content of an element a structural directive is applied to rendering blocks, in a scope holding their containers, and keeps it reactive', async () => {
    const panel = await register('panel', Panel, panelTemplate, ['allow', 'items', 'flag']);
    const host = load(await renderToString(panel.Server)) as unknown as Panel & Element;
    const root = host.shadowRoot!;
    const bold = root.querySelector('b')!;
    const items = Array.from(root.querySelectorAll('i'));

    panel.define();
    await flush();

    expect(console.warn).not.toHaveBeenCalled();
    expect(root.querySelector('b')).toBe(bold);
    expect(Array.from(root.querySelectorAll('i'))).toEqual(items);

    host.items.set(['b', 'c', 'a']);
    await flush();

    expect(Array.from(root.querySelectorAll('i')).map(node => node.textContent)).toEqual(['b', 'c', 'a']);
    expect(root.querySelectorAll('i')[0]).toBe(items[1]);
    expect(Array.from(root.querySelectorAll('u')).map(node => node.textContent)).toEqual(['b', 'c', 'a']);

    host.flag.set(false);
    await flush();
    expect(root.querySelectorAll('u')).toHaveLength(0);

    // The element goes, with the scope of its content and the scopes of the blocks it holds
    host.allow.set(false);
    await flush();
    expect(root.querySelector('div')).toBeNull();
    expect(root.querySelector('i')).toBeNull();
    expect(root.querySelector('p')!.textContent).toBe('end');

    host.allow.set(true);
    host.flag.set(true);
    await flush();
    expect(Array.from(root.querySelectorAll('u')).map(node => node.textContent)).toEqual(['b', 'c', 'a']);
  });
});

describe('namespaces', () => {
  /**
   * A drawing whose blocks render SVG elements, a template declared in an <svg> and rendered in another one, HTML in a
   * <foreignObject> and MathML.
   */
  class Drawing extends CustomElement {
    public open = signal(true);
    public points = signal([1, 2]);
  }

  const drawingTemplate = () => [
    '<svg><template dot()><rect /></template>@if (open()) { @for (point of points(); track point) { <circle /> } }<foreignObject>@if (open()) { <p /> }</foreignObject></svg>',
    '<svg><g>@if (open()) { @render dot() }</g></svg>',
    '<math><mi>x</mi>@if (open()) { <mn>1</mn> }</math>'
  ].join('');

  /**
   * The namespace of every element of the drawing, by tag name.
   */
  const namespacesOf = (root: ShadowRoot) => Array.from(root.querySelectorAll('*')).map(element => `${element.localName}:${element.namespaceURI!.split('/').at(-1)}`);

  const expected = ['svg:svg', 'circle:svg', 'circle:svg', 'foreignObject:svg', 'p:xhtml', 'svg:svg', 'g:svg', 'rect:svg', 'math:MathML', 'mi:MathML', 'mn:MathML'];

  it('creates each element in its namespace, in the blocks of an <svg>, in a template declared in one and in a <foreignObject>, also when the blocks render again', async () => {
    const drawing = await register('drawing', Drawing, drawingTemplate, ['open', 'points']);
    onServer = false;
    drawing.define();
    const host = document.body.appendChild(document.createElement(tag('client', 'drawing'))) as unknown as Drawing & Element;
    const root = host.shadowRoot!;

    expect(namespacesOf(root)).toEqual(expected);
    host.open.set(false);
    await flush();
    host.open.set(true);
    host.points.set([3, 4]);
    await flush();
    expect(namespacesOf(root)).toEqual(expected);
  });

  it('adopts the elements of the server in their namespace, and creates the ones it renders later there', async () => {
    const drawing = await register('drawing', Drawing, drawingTemplate, ['open', 'points']);
    const host = load(await renderToString(drawing.Server)) as unknown as Drawing & Element;
    const root = host.shadowRoot!;
    onServer = false;
    drawing.define();

    expect(console.warn).not.toHaveBeenCalled();
    host.open.set(false);
    await flush();
    host.open.set(true);
    await flush();
    // happy-dom parses <math> and its children of the server as HTML elements, which a browser parses as MathML
    expect(namespacesOf(root)).toEqual(expected.map(element => element.startsWith('math:') || element.startsWith('mi:') ? element.replace('MathML', 'xhtml') : element));
  });
});
