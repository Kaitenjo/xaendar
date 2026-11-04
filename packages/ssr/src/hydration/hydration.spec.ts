// @vitest-environment happy-dom
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
type CompilerCache = import('@xaendar/compiler').CompilerCache;
const { compileServer } = await import('@xaendar/ssr-compiler');
const { CustomElement, Property, StructuralDirective, _defineDirective, _defineRender } = core;
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
function declareInput(klass: object, name: string, value: unknown): (element: object) => unknown {
  const metadata = ((klass as Record<symbol, DecoratorMetadataObject | undefined>)[Symbol.for('Symbol.metadata')] ??= {});
  const storage = new WeakMap<object, unknown>();
  const target = { get(this: object) { return storage.get(this); }, set(this: object, input: unknown) { storage.set(this, input); } };
  const decorated = (Property(value) as unknown as (target: unknown, context: unknown) => { init(this: object): unknown, set(this: object, value: unknown): void })(target, { name, metadata });
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
 * Compiles a template with both generators, and registers a class of the component for each side.
 */
async function register(name: string, Base: Constructor<Component>, template: (tag: (name: string) => string) => string, signals: string[] = [], css?: string, cache?: CompilerCache): Promise<{ Server: Constructor<Component>, define: () => void }> {
  const Server = class extends Base { };
  customElements.define(tag('server', name), Server);
  _defineServerRender(Server, evaluate(await compileServer(template(child => tag('server', child)), { signals, cache: undefined as never })), css);

  const Client = class extends Base { };
  let styleSheet: CSSStyleSheet | undefined;
  if (css) {
    styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
  }
  _defineRender(Client, evaluate(await compile(template(child => tag('client', child)), { signals, cache: cache as never })), styleSheet);
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
} as unknown as CompilerCache;

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
    '<template row(text: string)><em>{ text() }</em></template>',
    '@if (users().length) {',
    `@for (user of users(); track user().id) {<${tag('badge')} label="{ user().name }">#{ $index() }</${tag('badge')}>}`,
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
      '<section>@for (item of items(); track item()) {<p>@if (open()) {<b>{ item() }</b>}</p>}</section>',
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
    const list = await register('list', List, () => '<ul>@for (item of items(); track item()) {<li>{ item() }</li>}</ul>', ['items']);
    const host = load(await renderToString(list.Server));
    const items = Array.from(host.shadowRoot!.querySelectorAll('li'));

    onServer = false;
    list.define();

    const rendered = Array.from(host.shadowRoot!.querySelectorAll('li'));
    expect(rendered.map(item => item.textContent)).toEqual(['b', 'c']);
    expect(rendered).not.toContain(items[1]);
    expect(console.warn).toHaveBeenCalledWith(`Xaendar: the server rendered in <${tag('client', 'list')}> other items in a <!--xd-for--> than the browser renders, which it renders again`);
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
      expect(await renderToString(noPlaceholder.Server)).toContain('<h2>Bare</h2><!--xd-c--><!--/xd-c-->');
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
      expect(root.innerHTML).toBe('<button>Ring</button><!--/xd-c--><!--/xd-if-->');

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
    async function renderStatic(name: string, template: (tag: (name: string) => string) => string, islands: string[], cache?: CompilerCache): Promise<Element> {
      const Static = class extends CustomElement { };
      customElements.define(tag('server', name), Static);
      _defineServerRender(Static, evaluate(await compileServer(template(child => tag('server', child)), { signals: [], islands: new Set(islands.map(island => tag('server', island))), cache: cache as never })));
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
      _defineServerRender(Static, evaluate(await compileServer('<i>Card</i><slot></slot>', { signals: [], cache: undefined as never })));
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
    } as unknown as CompilerCache;

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
      _defineServerRender(Server, evaluate(await compileServer(`@import { Chart } from './chart.ts';\n${template}`, { signals: [], templateDir: '/src', islands: new Set(islands), cache: { getImport } as unknown as CompilerCache })));
      return Server;
    }

    /**
     * Compiles the class of the chart for the browser.
     *
     * @returns Defines it.
     */
    async function registerChart(): Promise<() => void> {
      const Client = class extends Chart { };
      _defineRender(Client, evaluate(await compile('<i>{ center() }</i><slot></slot>', { signals: ['center'], cache: undefined as never })));
      return () => customElements.define(tag('client', 'chart'), Client);
    }

    /**
     * A page holding the chart, with both sides compiled.
     */
    async function registerPage(hydrate?: string): Promise<{ html: string, define: () => void }> {
      const page = (name: string) => `<${name} title="Map" center="{ 5 }"><a>Source</a></${name}>`;
      const Server = await defineOnServer('page', page(tag('server', 'chart')), [], hydrate);
      const Client = class extends CustomElement { };
      _defineRender(Client, evaluate(await compile(page(tag('client', 'chart')), { signals: [], cache: chartCache as never })));
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
      delete (globalThis as unknown as Record<string, unknown>).__xdEvents;
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
