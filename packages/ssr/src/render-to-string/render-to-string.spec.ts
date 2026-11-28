import type { ComponentOrDirectiveMetadata, ContextCache } from '@xaendar/compiler';
import type { Aliased, InputSignal } from '@xaendar/core/signals';
import type { ServerCompileOptions } from '@xaendar/ssr-compiler';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ServerRenderFunction } from '../types/server-render-function.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const core = await import('@xaendar/core');
const ssr = await import('@xaendar/ssr');
const { signal } = await import('@xaendar/core/signals');
const { compileServer } = await import('@xaendar/ssr-compiler');
const { CustomDirective, CustomElement, HostAttribute, Property, StructuralDirective, _defineDirective, _getComponentRuntime, getTransferState } = core;
const { _defineServerRender } = ssr;

/**
 * Renders a page, leaving out the script of the event contract, which `event-contract.util.spec.ts` covers: the text of
 * a function, which the tests of the HTML of a page have nothing to say about.
 */
const renderToString: typeof ssr.renderToString = async (...args) => (await ssr.renderToString(...args)).replace(/<script>\(.*?<\/script>/s, '');

/**
 * The `<style>` of a tree holding the inline styles of its elements, one rule per block of declarations, by index.
 */
const serverStyle = (nonce: string, ...blocks: string[]) => `<style data-xd-style=""${nonce ? ` nonce="${nonce}"` : ''}>${blocks.map((block, index) => `:is([data-xd-style="${index}"],#a#b#c#d#e){${block}}`).join('')}</style>`;

/**
 * Declares a host attribute on a field of a class, as `@HostAttribute` does.
 */
function declareHostAttribute(name: string, field: string, metadata: DecoratorMetadataObject): void {
  (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: field, static: false, metadata, access: { get: (owner: Record<string, unknown>) => owner[field] } });
}

/**
 * The metadata the compiler reads of a component or of a directive a template imports: its selector and its inputs,
 * the name of their property by the name they are bound with.
 */
const imported = (type: 'component' | 'directive', selector: string, inputs: Record<string, string>) => ({ type, selector, properties: new Map(Object.entries(inputs).map(([bound, name]) => [bound, { name }])) }) as unknown as ComponentOrDirectiveMetadata;

/**
 * Compiles a template for the server, importing the components and the directives given, and evaluates its code, the
 * imports of the runtime helpers given as parameters.
 */
async function compileWith(source: string, options: Pick<ServerCompileOptions, 'signals' | 'shadowingMembers' | 'islands'>, imports: ComponentOrDirectiveMetadata[] = []): Promise<ServerRenderFunction> {
  const declarations = imports.length ? `@import { ${imports.map((_, index) => `Imported${index}`).join(', ')} } from './imported'` : '';
  const cache = { getImport: async (name: string) => imports[Number(name.slice('Imported'.length))] } as unknown as ContextCache;
  const code = await compileServer(`${declarations}${source}`, { ...options, templateDir: '/', cache });
  const body = `${code.split('\n').filter(line => !line.startsWith('import ')).join('\n')}\nreturn render;`;
  const helpers: Record<string, unknown> = Object.assign({}, core, ssr);
  return new Function(...Object.keys(helpers), body)(...Object.values(helpers));
}

/**
 * Compiles a template for the server and evaluates its code (see {@link compileWith}).
 */
async function compile(source: string, signals: string[] = [], shadowingMembers: string[] = [], imports: ComponentOrDirectiveMetadata[] = []): Promise<ServerRenderFunction> {
  return compileWith(source, { signals, shadowingMembers }, imports);
}

/**
 * The getter and the setter of the private storage of an accessor, one value per instance, as the ones a decorator of a
 * real `accessor` receives.
 */
function accessorStorage(): { get(this: object): unknown, set(this: object, value: unknown): void } {
  const values = new WeakMap<object, unknown>();
  return {
    get(this: object) {
      return values.get(this);
    },
    set(this: object, value: unknown) {
      values.set(this, value);
    }
  };
}

/**
 * Declares an input on a component class as the accessor `@Property` decorates: the property holds the input signal,
 * and assigning it sets the value of the input.
 */
function declareInput(klass: object, name: string, value: unknown, metadata: DecoratorMetadataObject, reflect?: boolean): void {
  const access = { get: (element: object) => decorated.get.call(element) };
  const context = { kind: 'accessor', name, static: false, metadata, access, addInitializer: () => undefined };
  const decorated = (Property(value, { reflect }) as unknown as (target: unknown, context: unknown) => { get(this: object): unknown, set(this: object, value: unknown): void })(accessorStorage(), context);
  Object.defineProperty((klass as { prototype: object }).prototype, name, {
    get(this: object) { return decorated.get.call(this); },
    set(this: object, newValue: unknown) { decorated.set.call(this, newValue); }
  });
}

/**
 * A structural directive rendering its element once a promise resolves to its `allow` input.
 */
class DelayDirective extends StructuralDirective {
  public allow = (Property(true) as unknown as (target: unknown, context: unknown) => { get(this: object): () => boolean })(accessorStorage(), { name: 'allow', metadata: {} }).get.call(this);

  public shouldRender(): Promise<boolean> {
    const allow = this.allow();
    return Promise.resolve(allow);
  }
}
_defineDirective('delay', DelayDirective);

const badgeMetadata: DecoratorMetadataObject = {};
(HostAttribute('class.admin') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'admin', static: false, metadata: badgeMetadata, access: { get: (owner: { admin: () => boolean }) => owner.admin } });

/**
 * A component rendered by the root, writing a class on its own tag.
 */
class UserBadgeElement extends CustomElement {
  public declare label: () => string;
  public declare admin: () => boolean;
}
declareInput(UserBadgeElement, 'label', '', badgeMetadata);
declareInput(UserBadgeElement, 'admin', false, badgeMetadata);
Object.defineProperty(UserBadgeElement, Symbol.for('Symbol.metadata'), { value: badgeMetadata });
customElements.define('user-badge', UserBadgeElement);
_defineServerRender(UserBadgeElement, await compile('<span>{ label() }</span><slot></slot>', ['label']), ':host { display: block }');

const effect = vi.fn();
const rootMetadata: DecoratorMetadataObject = {};

/**
 * The root component, rendering every construct of a template.
 */
class TeamElement extends CustomElement {
  public declare heading: () => string;
  public users = signal([{ id: 1, name: 'Ada', admin: true }, { id: 2, name: 'Bob <2>', admin: false }]);
  public kind = 'b';
  public name = 'team';
  public created = this.createComponent(UserBadgeElement, { target: undefined as never });

  constructor() {
    super();
    this.effect(effect);
  }
}
declareInput(TeamElement, 'heading', 'Untitled', rootMetadata);
Object.defineProperty(TeamElement, Symbol.for('Symbol.metadata'), { value: rootMetadata });
customElements.define('team-list', TeamElement);
_defineServerRender(TeamElement, await compile([
  '<h1 class="title" class.long="{ heading().length > 5 }">{ heading() } &amp; { name }</h1>',
  '<template row(user: { name: string, admin: boolean }, index: number)>',
  '  <user-badge label="{ user.name }" admin="{ user.admin }">#{ index }</user-badge>',
  '</template>',
  '@if (users().length) {',
  '  @for (user of users(); track user.id) {',
  '    @render row(user, $index)',
  '  }',
  '} @else {',
  '  <p>Nobody</p>',
  '}',
  '@let total = users().length;',
  '@switch (kind) { @case (\'a\') { <i>a</i> } @case (\'b\', \'c\') { <i>{ total }</i> } @default { <i>?</i> } }',
  '<p @if (total > 1) { title="many" } @else { title="few" }>{ typeof window } { innerWidth }</p>',
  '<input #field value="{ field }" />',
  '<b *delay(allow="{ true }")>late</b><b *delay(allow="{ false }")>never</b>',
  '<xmp>a > b {}</xmp>',
  '<lazy-element></lazy-element>'
].join(''), ['heading', 'users'], ['name'], [imported('component', 'user-badge', { label: 'label', admin: 'admin' }), imported('directive', 'delay', { allow: 'allow' })]));

/**
 * A component reading a value of the transfer state when it is constructed.
 */
class GreetingElement extends CustomElement {
  public greeting = getTransferState<string>('greeting') ?? '';
}
customElements.define('greeting-card', GreetingElement);
_defineServerRender(GreetingElement, await compile('<p>{ greeting }</p>'));

describe('renderToString', () => {
  it('renders a component with its inputs, as declarative shadow roots, the components it renders included, marking the dynamic parts for the browser', async () => {
    const html = await renderToString(TeamElement, { heading: 'Our team' });

    expect(html).toBe([
      '<team-list data-xd-inputs="{&quot;heading&quot;:&quot;Our team&quot;}"><template shadowrootmode="open">',
      '<h1 class="title long"><!---->Our team<!----> &amp; <!---->team</h1>',
      '<!--xd-if:0--><!--xd-for-->',
      '<!--xd-item:n1--><user-badge class="admin"><template shadowrootmode="open"><style>:host { display: block }</style><span><!---->Ada</span><slot></slot></template>#<!---->0</user-badge>',
      '<!--xd-item:n2--><user-badge><template shadowrootmode="open"><style>:host { display: block }</style><span><!---->Bob &lt;2&gt;</span><slot></slot></template>#<!---->1</user-badge>',
      '<!--/xd-for--><!--/xd-if-->',
      '<!--xd-switch:1--><i><!---->2</i><!--/xd-switch-->',
      '<p title="many"><!---->undefined<!----> <!----></p>',
      '<input>',
      '<!--xd-s:1--><b>late</b><!--/xd-s--><!--xd-s:0--><!--/xd-s-->',
      '<xmp>a > b </xmp>',
      '<lazy-element></lazy-element>',
      '</template></team-list>'
    ].join(''));
  });

  it('writes a static value of an input an attribute writes into the attribute, which the component converts on the server too', async () => {
    const metadata: DecoratorMetadataObject = {};
    class SizeElement extends CustomElement {
      public declare size: () => number;
    }
    const access = { get: (element: object) => decorated.get.call(element) };
    const decorated = (Property(0, { attribute: 'data-size' }) as unknown as (target: unknown, context: unknown) => { get(this: object): unknown, set(this: object, value: unknown): void })(accessorStorage(), { kind: 'accessor', name: 'size', static: false, metadata, access, addInitializer: () => undefined });
    Object.defineProperty(SizeElement.prototype, 'size', { get(this: object) { return decorated.get.call(this); } });
    Object.defineProperty(SizeElement, Symbol.for('Symbol.metadata'), { value: metadata });
    const initializers = new Array<() => void>();
    core.WebComponent({ selector: 'size-label', templateUrl: './x.html' })(SizeElement, { metadata, addInitializer: (initializer: () => void) => initializers.push(initializer) } as never);
    initializers[0].call(SizeElement);
    _defineServerRender(SizeElement, await compile('<b>{ size() + 1 }</b>', ['size']));
    class SizesElement extends CustomElement { }
    customElements.define('size-list', SizesElement);
    const sizeInput = { type: 'component', selector: 'size-label', properties: new Map([['size', { name: 'size', attribute: 'data-size' }]]) } as unknown as ComponentOrDirectiveMetadata;
    _defineServerRender(SizesElement, await compile('<size-label size="3"></size-label>', [], [], [sizeInput]));

    expect(await renderToString(SizesElement)).toBe('<size-list><template shadowrootmode="open"><size-label data-size="3"><template shadowrootmode="open"><b><!---->4</b></template></size-label></template></size-list>');
  });

  it('writes the inputs a component reflects as attributes of its element', async () => {
    const metadata: DecoratorMetadataObject = {};
    class LockElement extends CustomElement { }
    declareInput(LockElement, 'locked', false, metadata, true);
    declareInput(LockElement, 'lockLevel', 0, metadata, true);
    Object.defineProperty(LockElement, Symbol.for('Symbol.metadata'), { value: metadata });
    customElements.define('lock-switch', LockElement);
    _defineServerRender(LockElement, await compile('<i></i>'));

    expect(await renderToString(LockElement, { locked: true, lockLevel: 2 })).toBe('<lock-switch locked="" lock-level="2" data-xd-inputs="{&quot;locked&quot;:true,&quot;lockLevel&quot;:2}"><template shadowrootmode="open"><i></i></template></lock-switch>');
    expect(await renderToString(LockElement)).toBe('<lock-switch lock-level="0"><template shadowrootmode="open"><i></i></template></lock-switch>');
  });

  it('writes the options of the shadow root its @WebComponent declares on the declarative shadow root, assigning no slot', async () => {
    class MenuElement extends CustomElement { }
    Object.defineProperty(MenuElement, Symbol.for('Symbol.metadata'), { value: { selector: 'focus-menu', shadowRoot: { delegatesFocus: true, slotAssignment: 'manual', serializable: true, clonable: true } } });
    customElements.define('focus-menu', MenuElement);
    _defineServerRender(MenuElement, await compile('<button>open</button><slot></slot>'));

    expect(await renderToString(MenuElement)).toBe('<focus-menu><template shadowrootmode="open" shadowrootdelegatesfocus shadowrootslotassignment="manual" shadowrootserializable shadowrootclonable><button>open</button><slot></slot></template></focus-menu>');
  });

  it('writes the transfer state after the element, its values read on the server by the components, without writing empty inputs or an empty state', async () => {
    const lessThan = `${String.fromCharCode(92)}u003c`;

    const html = await renderToString(GreetingElement, {}, { state: { greeting: '</script><b>', since: new Date(0) } });
    const empty = await renderToString(GreetingElement, undefined, { state: {} });

    expect(html).toBe([
      '<greeting-card><template shadowrootmode="open"><p><!---->&lt;/script&gt;&lt;b&gt;</p></template></greeting-card>',
      `<script type="application/json" data-xd-state>{"greeting":"${lessThan}/script>${lessThan}b>","since":{"$":"Date","value":0}}</script>`
    ].join(''));
    expect(empty).toBe('<greeting-card><template shadowrootmode="open"><p><!----></p></template></greeting-card>');
  });

  it('renders the content of a @try, or its @catch with the error when the content throws, after the marker of the block, the last node of the shadow root having no closing one', async () => {
    class SafeCard extends CustomElement {
      public city(): string {
        return 'Rome';
      }
    }
    class BrokenCard extends CustomElement {
      public city(): string {
        throw new Error('No city');
      }
    }
    const template = '<h2>Card</h2>@try {<p>{ city() }</p>} @catch (error) {<i>{ error.message }</i>}';
    customElements.define('safe-card', SafeCard);
    customElements.define('broken-card', BrokenCard);
    _defineServerRender(SafeCard, await compile(template));
    _defineServerRender(BrokenCard, await compile(template));

    expect(await renderToString(SafeCard)).toContain('<h2>Card</h2><!--xd-t:0--><p><!---->Rome</p></template>');
    expect(await renderToString(BrokenCard)).toContain('<h2>Card</h2><!--xd-t:1--><i><!---->No city</i></template>');
  });

  it('catches in a @try the error of a child component the content renders, dropping what the content wrote', async () => {
    class FailingChild extends CustomElement {
      public onInit(): void {
        throw new Error('Child failed');
      }
    }
    class TryingParent extends CustomElement { }
    customElements.define('failing-child', FailingChild);
    customElements.define('trying-parent', TryingParent);
    _defineServerRender(FailingChild, await compile('<p>child</p>'));
    _defineServerRender(TryingParent, await compile('@try {<b>before</b><failing-child></failing-child>} @catch (error) {<p>{ error.message }</p>}'));

    expect(await renderToString(TryingParent)).toContain('<!--xd-t:1--><p><!---->Child failed</p></template>');
  });

  it('renders the @case of a @switch one of whose values is strictly equal to the value, or else the @default', async () => {
    const render = await compile('<div>@switch (kind) { @case (\'a\') {<i>a</i>} @case (\'b\', \'c\') {<i>b or c</i>} @default {<i>other</i>} }</div><p></p>');
    const kinds: unknown[] = ['a', 'c', 'z', 'b, c'];
    const html = new Array<string>();
    for (let i = 0; i < kinds.length; i++) {
      const KindCard = class extends CustomElement {
        public kind = kinds[i];
      };
      customElements.define(`kind-card-${i}`, KindCard);
      _defineServerRender(KindCard, render);
      html.push((await renderToString(KindCard)).replace(/^.*shadowrootmode="open"><div>|<\/div>.*$/gs, ''));
    }

    expect(html).toEqual([
      '<!--xd-switch:0--><i>a</i>',
      '<!--xd-switch:1--><i>b or c</i>',
      '<!--xd-switch:2--><i>other</i>',
      '<!--xd-switch:2--><i>other</i>'
    ]);
  });

  it('renders only the @placeholder of a @defer between the markers of the block, or nothing without one, the last one of the shadow root without closing marker', async () => {
    class DeferringCard extends CustomElement { }
    customElements.define('deferring-card', DeferringCard);
    _defineServerRender(DeferringCard, await compile('<h2>Card</h2>@defer (interaction) {<b>content</b>} @placeholder {<button>Load</button>} @loading {<i>loading</i>} @error {<s>error</s>}@defer (idle) {<b>content</b>}'));

    expect(await renderToString(DeferringCard)).toContain('<h2>Card</h2><!--xd-d--><button>Load</button><!--/xd-d--><!--xd-d--></template>');
  });

  it('writes the markers of @xaendar/core, the ones of the code generated by @xaendar/ssr-compiler included', async () => {
    const { _SSR_MARKERS: markers } = core;
    class MarkersElement extends CustomElement {
      public items = [1];
    }
    customElements.define('markers-card', MarkersElement);
    _defineServerRender(MarkersElement, await compile('@if (true) { a }@switch (1) { @case (1) { b } }@for (item of items; track item) { c }@client { d }@client { e } @placeholder { f }@defer (idle) { g } @placeholder { h }'));

    const html = await renderToString(MarkersElement);

    expect(html).toContain([
      `<!--${markers.if}:0--> a <!--/${markers.if}-->`,
      `<!--${markers.switch}:0--> b <!--/${markers.switch}-->`,
      `<!--${markers.for}--><!--${markers.item}:n1--> c <!--/${markers.for}-->`,
      `<!--${markers.client}--><!--/${markers.client}-->`,
      `<!--${markers.client}--> f <!--/${markers.client}-->`,
      `<!--${markers.defer}--> h </template>`
    ].join(''));
  });

  it('closes every block with a marker but the last node of an element or of the shadow root, and the blocks of the body of a @for', async () => {
    class PositionsElement extends CustomElement {
      public rows = [1];
    }
    customElements.define('positions-card', PositionsElement);
    _defineServerRender(PositionsElement, await compile('<p>@if (true) { a } b</p><ul>@for (row of rows; track row) {<li>@if (true) { c }</li>@if (true) { d }}</ul><td>@if (true) {<b></b>@switch (1) { @case (1) { e } }}</td>@if (true) { f }@let g = 1;'));

    const html = await renderToString(PositionsElement);

    expect(html).toContain([
      '<p><!--xd-if:0--> a <!--/xd-if--> b</p>',
      '<ul><!--xd-for--><!--xd-item:n1--><li><!--xd-if:0--> c </li><!--xd-if:0--> d <!--/xd-if--></ul>',
      '<td><!--xd-if:0--><b></b><!--xd-switch:0--> e </td>',
      '<!--xd-if:0--> f </template>'
    ].join(''));
  });

  it('applies the custom directives of a native element, the ones of its selected branches included: onInit and @HostAttribute run, the effects do not, the content assigned to innerHTML follows the start tag', async () => {
    const directiveEffect = vi.fn();
    const fillMetadata: DecoratorMetadataObject = {};
    (HostAttribute('class.filled') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'filled', static: false, metadata: fillMetadata, access: { get: (owner: { filled: boolean }) => owner.filled } });

    /**
     * A directive filling its element with the HTML of its input, on the server only.
     */
    class FillDirective extends CustomDirective {
      public content = (Property('') as unknown as (target: unknown, context: unknown) => { get(this: object): () => string })(accessorStorage(), { name: 'content', metadata: fillMetadata }).get.call(this);
      public filled = true;

      constructor() {
        super();
        this.effect(directiveEffect);
      }

      public onInit(): void {
        if (typeof window === 'undefined') {
          this.element.innerHTML = this.content();
        }
      }
    }
    Object.defineProperty(FillDirective, Symbol.for('Symbol.metadata'), { value: fillMetadata });
    _defineDirective('fill', FillDirective);

    /**
     * A directive marking its element with an attribute.
     */
    class MarkDirective extends CustomDirective {
      public onInit(): void {
        this.element.setAttribute('data-mark', '');
      }
    }
    _defineDirective('mark', MarkDirective);

    /**
     * A component applying the directives.
     */
    class FilledElement extends CustomElement {
      public html = '<b>a &amp; b</b>';
      public on = true;
    }
    customElements.define('filled-card', FilledElement);
    _defineServerRender(FilledElement, await compile('<p @@fill(content="{ html }")></p><span @if (on) { @@mark }>x</span><i @if (!on) { @@mark }>y</i>', [], [], [imported('directive', 'fill', { content: 'content' })]));

    const html = await renderToString(FilledElement);

    expect(html).toBe('<filled-card><template shadowrootmode="open"><p class="filled"><b>a &amp; b</b></p><span data-mark="">x</span><i>y</i></template></filled-card>');
    expect(directiveEffect).not.toHaveBeenCalled();
  });

  it('merges the class and the style of the template and of the directives of an element key by key, the template winning, then the directive applied later', async () => {
    const directiveOf = (selector: string, properties: Record<string, [name: string, value: unknown]>) => {
      const metadata: DecoratorMetadataObject = {};
      for (const [member, [name, value]] of Object.entries(properties)) {
        (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: () => value } });
      }

      const Directive = class extends CustomDirective { };
      Object.defineProperty(Directive, Symbol.for('Symbol.metadata'), { value: metadata });
      _defineDirective(selector, Directive);
    };
    directiveOf('wide', { width: ['style.width.px', 20], color: ['style.color', 'blue'], on: ['class.on', true], kind: ['class', 'wide'] });
    directiveOf('narrow', { width: ['style.width.px', 5], gap: ['style', 'gap: 2px'] });

    /**
     * A component whose element merges the class and the style of its template and of two directives.
     */
    class MergedElement extends CustomElement {
      public off = null;
    }
    customElements.define('merged-card', MergedElement);
    _defineServerRender(MergedElement, await compile('<p class="a" style="color: red" class.on="{ off }" @@wide @@narrow></p>', [], [], []));

    expect(await renderToString(MergedElement)).toBe(`<merged-card><template shadowrootmode="open">${serverStyle('', 'color: red; width: 5px; gap: 2px;')}<p class="a wide on" data-xd-style="0"></p></template></merged-card>`);
  });

  it('checks a URL running code as the security of the project asks, on the elements written inline and by the runtime alike', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    /**
     * A component binding a URL running code to the links it renders.
     */
    class LinkElement extends CustomElement {
      public link = 'javascript:alert(1)';
      public on = true;
    }
    customElements.define('unsafe-links', LinkElement);
    _defineServerRender(LinkElement, await compileWith('<a href="{ link }">a</a><a class.on="{ on }" href="{ link }" title="{ link }">b</a><a href="{ \'/safe\' }">c</a>', { signals: [] }));

    // Left out, as the default of the project asks: neither the title nor the safe URL are checked
    expect(await renderToString(LinkElement)).toBe('<unsafe-links><template shadowrootmode="open"><a>a</a><a class="on" title="javascript:alert(1)">b</a><a href="/safe">c</a></template></unsafe-links>');
    expect(warn).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });

  it('writes no declaration a style value bound to a key adds with a ;, as a browser rejects it', async () => {
    /**
     * A component binding a value holding a declaration to a style key.
     */
    class InjectedElement extends CustomElement {
      public color = 'red; position: fixed';
    }
    customElements.define('injected-card', InjectedElement);
    _defineServerRender(InjectedElement, await compile('<p style.color="{ color }" style.width="{ \'1px\' }" style.background="{ \'url(a;b)\' }"></p>', [], [], []));

    expect(await renderToString(InjectedElement)).toBe(`<injected-card><template shadowrootmode="open">${serverStyle('', 'width: 1px; background: url(a;b);')}<p data-xd-style="0"></p></template></injected-card>`);
  });

  describe('the inline styles', () => {
    it('moves the inline style of the elements into a rule of the <style> of their shadow root, after the stylesheet, both with the nonce, the elements with the same declarations sharing a rule', async () => {
      /**
       * A component styling the elements of its template.
       */
      class StyledElement extends CustomElement { }
      customElements.define('styled-card', StyledElement);
      _defineServerRender(StyledElement, await compile('<p style="color: red">a</p><i style="color: red"></i><b style.width.px="{ 4 }"></b><span></span>'), ':host { display: block }');

      const html = await ssr.renderToString(StyledElement, undefined, { nonce: 'n"1' });

      expect(html.replace(/<script nonce="n&quot;1">\(.*?<\/script>/s, '')).toBe(`<styled-card><template shadowrootmode="open"><style nonce="n&quot;1">:host { display: block }</style>${serverStyle('n&quot;1', 'color: red;', 'width: 4px;')}<p data-xd-style="0">a</p><i data-xd-style="0"></i><b data-xd-style="1"></b><span></span></template></styled-card>`);
    });

    it('moves the inline style of the root of a page into a <style> right before it, and the one of a component into the <style> of the shadow root rendering it', async () => {
      const childMetadata: DecoratorMetadataObject = {};
      declareHostAttribute('style.color', 'color', childMetadata);

      /**
       * A component writing a style property on its element.
       */
      class HostedChild extends CustomElement {
        public color = 'red';
      }
      Object.defineProperty(HostedChild, Symbol.for('Symbol.metadata'), { value: childMetadata });
      customElements.define('hosted-child', HostedChild);
      _defineServerRender(HostedChild, await compile('<i style="gap: 1px"></i>'));
      const rootMetadata: DecoratorMetadataObject = {};
      declareHostAttribute('style.display', 'display', rootMetadata);

      /**
       * A root writing a style property on its element, and binding one on the element of its child.
       */
      class HostedRoot extends CustomElement {
        public display = 'grid';
      }
      Object.defineProperty(HostedRoot, Symbol.for('Symbol.metadata'), { value: rootMetadata });
      customElements.define('hosted-root', HostedRoot);
      _defineServerRender(HostedRoot, await compile('<hosted-child style.width.px="{ 2 }"></hosted-child>'));

      expect(await renderToString(HostedRoot)).toBe([
        serverStyle('', 'display: grid;'),
        '<hosted-root data-xd-style="0"><template shadowrootmode="open">',
        serverStyle('', 'width: 2px; color: red;'),
        `<hosted-child data-xd-style="0"><template shadowrootmode="open">${serverStyle('', 'gap: 1px;')}<i data-xd-style="0"></i></template></hosted-child>`,
        '</template></hosted-root>'
      ].join(''));
    });

    it('moves the inline styles of the parts rendered later into the <style> of their shadow root, once every part is rendered', async () => {
      /**
       * A component styling elements structural directives render later.
       */
      class DelayedStylesElement extends CustomElement { }
      customElements.define('delayed-styles', DelayedStylesElement);
      _defineServerRender(DelayedStylesElement, await compile('<p *delay(allow="{ true }")><b *delay(allow="{ true }") style="color: red"></b></p><i style="gap: 1px"></i>', [], [], [imported('directive', 'delay', { allow: 'allow' })]));

      expect(await renderToString(DelayedStylesElement)).toBe(`<delayed-styles><template shadowrootmode="open">${serverStyle('', 'gap: 1px;', 'color: red;')}<!--xd-s:1--><p><!--xd-s:1--><b data-xd-style="1"></b></p><!--/xd-s--><i data-xd-style="0"></i></template></delayed-styles>`);
    });

    it('leaves out of the rule a declaration whose value would end it, writing no attribute for an element left without declarations', async () => {
      /**
       * A component binding a value ending the rule of its element to a style key.
       */
      class BreakingElement extends CustomElement {
        public color = 'red} p {color: blue';
      }
      customElements.define('breaking-card', BreakingElement);
      _defineServerRender(BreakingElement, await compile('<p style.width="{ \'1px\' }" style.color="{ color }"></p><i style.color="{ color }"></i>'));

      expect(await renderToString(BreakingElement)).toBe(`<breaking-card><template shadowrootmode="open">${serverStyle('', 'width: 1px;')}<p data-xd-style="0"></p><i></i></template></breaking-card>`);
    });
  });

  describe('the interactive components a static template renders', () => {
    const metadata: DecoratorMetadataObject = {};

    /**
     * An interactive component with an input written under an alias.
     */
    class IslandElement extends CustomElement {
      public declare start: () => number;
      public declare kind: () => string;
    }
    declareInput(IslandElement, 'start', 0, metadata);
    declareInput(IslandElement, 'kind', '', metadata);
    (metadata as { aliasToAttribute: Record<string, string> }).aliasToAttribute = { first: 'start', kind: 'kind' };
    Object.defineProperty(IslandElement, Symbol.for('Symbol.metadata'), { value: metadata });
    customElements.define('island-card', IslandElement);

    beforeAll(async () => {
      _defineServerRender(IslandElement, await compile('<b>{ start() }</b>', ['start']));
    });

    /**
     * Compiles a static template rendering the component, and renders it.
     */
    const renderIsland = async (name: string, template: string, Base: typeof CustomElement = CustomElement) => {
      const Static = class extends Base { };
      customElements.define(name, Static);
      _defineServerRender(Static, await compileWith(template, { signals: [], islands: new Set(['island-card', 'unknown-card']) }, [imported('component', 'island-card', { first: 'start', kind: 'kind' })]));
      return renderToString(Static);
    };

    it('writes the inputs bound here by the name of their property, and always the attribute', async () => {
      expect(await renderIsland('static-one', '<island-card first="{ 5 }" kind="a" class="b"></island-card>')).toContain('<island-card class="b" data-xd-inputs="{&quot;start&quot;:5,&quot;kind&quot;:&quot;a&quot;}"><template');
      expect(await renderIsland('static-two', '<island-card></island-card>')).toContain('<island-card data-xd-inputs="{}"><template');
    });

    it('writes the inputs of the conditional bindings, not the classes named like an input', async () => {
      expect(await renderIsland('static-three', '<island-card class.kind="{ true }" @if (true) { first="{ 2 }" }></island-card>')).toContain('data-xd-inputs="{&quot;start&quot;:2}"');
    });

    it('writes a custom element without a class as any other element', async () => {
      expect(await renderIsland('static-four', '<unknown-card first="a"></unknown-card>')).toContain('<unknown-card first="a"></unknown-card>');
    });

    it('throws when a value cannot be written into the HTML', async () => {
      await expect(renderIsland('static-five', '<island-card first="{ Math.max }"></island-card>')).rejects.toThrow('<island-card>.start is a function, which cannot be written into the HTML');
    });
  });

  it('throws when an input or a value of the transfer state cannot be written into the HTML', async () => {
    await expect(renderToString(TeamElement, { heading: (() => 'Our team') as never })).rejects.toThrow('inputs.heading is a function, which cannot be written into the HTML');
    await expect(renderToString(GreetingElement, undefined, { state: { format: () => 'hi' } })).rejects.toThrow('state.format is a function, which cannot be written into the HTML');
  });

  it('takes the inputs declaring an alias by it, setting them and writing them into data-xd-inputs by the name of their property', async () => {
    /**
     * A component whose inputs declare aliases, the name of the property of one being the alias of the other.
     */
    class CrossedElement extends CustomElement {
      public declare internalValue: Aliased<InputSignal<string>, 'value'>;
      public declare value: Aliased<InputSignal<string>, 'initialValue'>;
    }
    const metadata: DecoratorMetadataObject = {};
    declareInput(CrossedElement, 'internalValue', '', metadata);
    declareInput(CrossedElement, 'value', '', metadata);
    Object.defineProperty(CrossedElement, Symbol.for('Symbol.metadata'), { value: Object.assign(metadata, { aliasToAttribute: { value: 'internalValue', initialValue: 'value' } }) });
    customElements.define('crossed-card', CrossedElement);
    _defineServerRender(CrossedElement, await compile('<i>{ internalValue() }</i><b>{ value() }</b>', ['internalValue', 'value']));

    const html = await renderToString(CrossedElement, { value: 'a', initialValue: 'b' });

    expect(html).toContain('<crossed-card data-xd-inputs="{&quot;internalValue&quot;:&quot;a&quot;,&quot;value&quot;:&quot;b&quot;}">');
    expect(html).toContain('<i><!---->a</i><b><!---->b</b>');
    // The types accept it, as a name a host directive may expose: the runtime rejects it
    await expect(renderToString(CrossedElement, { internalValue: 'x' })).rejects.toThrow('"internalValue" is the property of an input of CrossedElement declaring an alias: bind it by its alias');
  });

  it('sets an input a host directive exposes into the directive, by the name it is exposed with, as the client does', async () => {
    /**
     * A directive declaring the input its component exposes.
     */
    class TipDirective extends CustomDirective {
      public declare text: InputSignal<string>;
    }
    const tipMetadata: DecoratorMetadataObject = {};
    declareInput(TipDirective, 'text', '', tipMetadata);
    Object.defineProperty(TipDirective, Symbol.for('Symbol.metadata'), { value: tipMetadata });

    /**
     * A component exposing the input of its host directive as `hint`, read by its template.
     */
    class TipCardElement extends CustomElement {
      public declare hint: InputSignal<string>;
    }
    Object.defineProperty(TipCardElement, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [{ directive: TipDirective, properties: [{ name: 'text', alias: 'hint' }] }] } });
    customElements.define('tip-card', TipCardElement);
    _defineServerRender(TipCardElement, await compile('<p>{ hint() }</p>', ['hint']));

    /**
     * A component binding the exposed input of the tip card.
     */
    class TipPageElement extends CustomElement { }
    customElements.define('tip-page', TipPageElement);
    const tipCard = { type: 'component', selector: 'tip-card', properties: new Map([['hint', { name: 'text', exposed: true }]]) } as unknown as ComponentOrDirectiveMetadata;
    _defineServerRender(TipPageElement, await compile('<tip-card hint="{ \'hello\' }" />', [], [], [tipCard]));

    expect(await renderToString(TipPageElement)).toContain('<tip-card><template shadowrootmode="open"><p><!---->hello</p></template></tip-card>');
    expect(await renderToString(TipCardElement, { hint: 'direct' })).toContain('<p><!---->direct</p>');
    // A name that is neither an input nor an exposed one throws, as it does in createComponent and in the templates
    await expect(renderToString(TipCardElement, { hnit: 'x' })).rejects.toThrow('TipCardElement does not declare a property named "hnit"');
  });

  it('throws when the inputs leave out a required input, before any code of the component runs', async () => {
    const constructed = vi.fn();

    /**
     * A component with a required input, as `@Property.required` declares it.
     */
    class ProfileElement extends CustomElement {
      public declare name: () => string;

      constructor() {
        super();
        constructed();
      }
    }
    const metadata: DecoratorMetadataObject = {};
    declareInput(ProfileElement, 'name', '', metadata);
    Object.defineProperty(ProfileElement, Symbol.for('Symbol.metadata'), { value: Object.assign(metadata, { requiredInputs: new Set(['name']) }) });
    customElements.define('profile-card', ProfileElement);
    _defineServerRender(ProfileElement, await compile('<p>{ name() }</p>', ['name']));
    const missing = 'The required input "name" of ProfileElement is not bound by the inputs of renderToString';

    await expect(renderToString(ProfileElement)).rejects.toThrow(missing);
    await expect(renderToString(ProfileElement, {})).rejects.toThrow(missing);
    expect(constructed).not.toHaveBeenCalled();
    expect(await renderToString(ProfileElement, { name: 'Ada' })).toContain('<p><!---->Ada</p>');
  });

  it('runs no effect of the components and renders no component they create, putting the runtime of the browser back', async () => {
    const browser = _getComponentRuntime();

    await renderToString(TeamElement);

    expect(effect).not.toHaveBeenCalled();
    expect(_getComponentRuntime()).toBe(browser);
  });

  it('throws when the component is not defined', async () => {
    class UndefinedElement extends CustomElement { }

    await expect(renderToString(UndefinedElement)).rejects.toThrow('UndefinedElement is not defined: decorate it with @WebComponent');
  });

  it('writes only the element of a component rendering only in the browser, with its inputs and its trigger, running no code of it', async () => {
    const constructed = vi.fn();
    class BrowserElement extends CustomElement {
      constructor() {
        super();
        constructed();
      }
    }
    Object.defineProperty(BrowserElement, Symbol.for('Symbol.metadata'), { value: { render: false, hydrate: 'idle' } });
    customElements.define('browser-root', BrowserElement);

    const html = await renderToString(BrowserElement, { title: 'Ada' } as never, { state: { a: 1 } });

    expect(html).toContain('<browser-root data-xd-client="" data-xd-hydrate="idle" data-xd-inputs="');
    expect(html).toContain('</browser-root><script type="application/json" data-xd-state>');
    expect(html).not.toContain('<template');
    expect(constructed).not.toHaveBeenCalled();
  });

  it('writes a component rendering only in the browser without inputs', async () => {
    class BareElement extends CustomElement { }
    Object.defineProperty(BareElement, Symbol.for('Symbol.metadata'), { value: { render: false } });
    customElements.define('bare-root', BareElement);

    expect(await renderToString(BareElement)).toBe('<bare-root data-xd-client=""></bare-root>');
  });

  it('writes the event contract right after the element, before the transfer state, with the events of the components of the page, but the ones of the window and of the document', async () => {
    class Listening extends CustomElement { }
    class Nested extends CustomElement { }
    Object.defineProperty(Nested, Symbol.for('Symbol.metadata'), { value: { hostListeners: [{ name: 'pointerenter' }, { name: 'resize', target: 'window' }, { name: 'wheel', target: 'document' }] } });
    customElements.define('listening-root', Listening);
    customElements.define('listening-nested', Nested);
    _defineServerRender(Listening, await compile('<button (pointerdown)="noop()"></button><listening-nested></listening-nested>'));
    _defineServerRender(Nested, await compile('<p></p>'));

    const html = await ssr.renderToString(Listening, undefined, { state: { a: 1 } });

    expect(html).toMatch(/<\/listening-root><script>\(.*"pointerdown","pointerenter".*<\/script><script type="application\/json" data-xd-state>/s);
    expect(html).not.toContain('"resize"');
    expect(html).not.toContain('"wheel"');
  });

  it('writes the nonce of the response on the script of the event contract', async () => {
    class Secured extends CustomElement { }
    customElements.define('secured-root', Secured);
    _defineServerRender(Secured, await compile('<p></p>'));

    expect(await ssr.renderToString(Secured, undefined, { nonce: 'r4nd0m' })).toContain('</secured-root><script nonce="r4nd0m">(');
  });

  it('throws when the component has no template compiled for the server', async () => {
    class ClientOnlyElement extends CustomElement { }
    customElements.define('client-only-root', ClientOnlyElement);

    await expect(renderToString(ClientOnlyElement)).rejects.toThrow('ClientOnlyElement has no template compiled for the server');
  });

  describe('customized built-in elements', () => {
    const copyMetadata: DecoratorMetadataObject = { selector: 'copy-button', extends: 'button', hostListeners: [{ name: 'click' }] };
    (HostAttribute('aria-label') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'label', static: false, metadata: copyMetadata, access: { get: (owner: { label: () => string }) => owner.label } });

    /**
     * A customized built-in element without a template, on a tag accepting no shadow root.
     */
    class CopyButtonElement extends core.customElementOf(HTMLButtonElement) {
      public declare label: () => string;
    }
    declareInput(CopyButtonElement, 'label', 'Copy', copyMetadata);
    Object.defineProperty(CopyButtonElement, Symbol.for('Symbol.metadata'), { value: copyMetadata });
    customElements.define('copy-button', CopyButtonElement, { extends: 'button' });

    /**
     * A customized built-in element with a template, on a tag accepting a shadow root.
     */
    class PanelElement extends core.customElementOf(HTMLDivElement) { }
    Object.defineProperty(PanelElement, Symbol.for('Symbol.metadata'), { value: { selector: 'x-panel', extends: 'div' } });
    customElements.define('x-panel', PanelElement, { extends: 'div' });

    beforeAll(async () => {
      _defineServerRender(PanelElement, await compile('<h2>Panel</h2><slot></slot>'));
    });

    it('writes the ones a template renders with their tag and their is first, the shadow root of the one with a template, the attribute waiting for the hydration of the other', async () => {
      class ToolbarElement extends CustomElement { }
      customElements.define('built-in-toolbar', ToolbarElement);
      _defineServerRender(ToolbarElement, await compile('<div is="x-panel" class="wide"><button is="copy-button" label="Copy the code" type="button">Copy</button></div>', [], [], [imported('component', 'x-panel', {}), imported('component', 'copy-button', { label: 'label' })]));

      const html = await renderToString(ToolbarElement);

      expect(html).toContain('<div is="x-panel" class="wide"><template shadowrootmode="open"><h2>Panel</h2><slot></slot></template>');
      expect(html).toContain('<button is="copy-button" type="button" data-xd-client="" aria-label="Copy the code">Copy</button></div>');
    });

    it('renders the root of a page with the tag it extends and its is, without a shadow root when it has no template', async () => {
      expect(await renderToString(CopyButtonElement, { label: 'Paste' })).toBe('<button is="copy-button" data-xd-client="" aria-label="Paste" data-xd-inputs="{&quot;label&quot;:&quot;Paste&quot;}"></button>');
      expect(await renderToString(PanelElement)).toBe('<div is="x-panel"><template shadowrootmode="open"><h2>Panel</h2><slot></slot></template></div>');
    });

    it('writes no end tag for the root extending a void element, and its is on the root rendering only in the browser', async () => {
      class MaskedInputElement extends core.customElementOf(HTMLInputElement) { }
      Object.defineProperty(MaskedInputElement, Symbol.for('Symbol.metadata'), { value: { selector: 'masked-input', extends: 'input' } });
      customElements.define('masked-input', MaskedInputElement, { extends: 'input' });
      class BrowserButtonElement extends core.customElementOf(HTMLButtonElement) { }
      Object.defineProperty(BrowserButtonElement, Symbol.for('Symbol.metadata'), { value: { selector: 'browser-button', extends: 'button', render: false } });
      customElements.define('browser-button', BrowserButtonElement, { extends: 'button' });

      expect(await renderToString(MaskedInputElement)).toBe('<input is="masked-input" data-xd-client="">');
      expect(await renderToString(BrowserButtonElement)).toBe('<button is="browser-button" data-xd-client=""></button>');
    });

    it('records the events a customized built-in element without a template listens to on its element', async () => {
      expect(await ssr.renderToString(CopyButtonElement)).toMatch(/<\/button><script>\(.*"click".*<\/script>$/s);
    });
  });
});
