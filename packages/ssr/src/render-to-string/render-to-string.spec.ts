import type { ComponentOrDirectiveMetadata, ContextCache } from '@xaendar/compiler';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ServerCompileOptions } from '@xaendar/ssr-compiler';
import type { Aliased, InputSignal } from '@xaendar/core/signals';
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
const { CustomDirective, CustomElement, HostProperty, Property, StructuralDirective, _defineDirective, _getComponentRuntime, getTransferState } = core;
const { _defineServerRender } = ssr;

/**
 * Renders a page, leaving out the script of the event contract, which `event-contract.util.spec.ts` covers: the text of
 * a function, which the tests of the HTML of a page have nothing to say about.
 */
const renderToString: typeof ssr.renderToString = async (...args) => (await ssr.renderToString(...args)).replace(/<script>\(.*?<\/script>/s, '');

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
 * Declares an input on a component class as the accessor `@Property` decorates: the property holds the input signal,
 * and assigning it sets the value of the input.
 */
function declareInput(klass: object, name: string, value: unknown, metadata: DecoratorMetadataObject): void {
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
}

/**
 * A structural directive rendering its element once a promise resolves to its `allow` input.
 */
class DelayDirective extends StructuralDirective {
  public allow = (Property(true) as unknown as (target: unknown, context: unknown) => { init(this: object): () => boolean })({}, { name: 'allow', metadata: {} }).init.call(this);

  public shouldRender(): Promise<boolean> {
    const allow = this.allow();
    return Promise.resolve(allow);
  }
}
_defineDirective('delay', DelayDirective);

const badgeMetadata: DecoratorMetadataObject = {};
(HostProperty('class.admin') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'admin', static: false, metadata: badgeMetadata, access: { get: (owner: { admin: () => boolean }) => owner.admin } });

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
  '<h1 class="title" [class.long]="{ heading().length > 5 }">{ heading() } &amp; { name }</h1>',
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
  '<style>a > b {}</style>',
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
      '<style>a > b </style>',
      '<lazy-element></lazy-element>',
      '</template></team-list>'
    ].join(''));
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

  it('renders the content of a @try, or its @catch with the error when the content throws, between the markers of the block', async () => {
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

    expect(await renderToString(SafeCard)).toContain('<h2>Card</h2><!--xd-t:0--><p><!---->Rome</p><!--/xd-t-->');
    expect(await renderToString(BrokenCard)).toContain('<h2>Card</h2><!--xd-t:1--><i><!---->No city</i><!--/xd-t-->');
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

    expect(await renderToString(TryingParent)).toContain('<!--xd-t:1--><p><!---->Child failed</p><!--/xd-t-->');
  });

  it('renders only the @placeholder of a @defer between the markers of the block, or nothing without one', async () => {
    class DeferringCard extends CustomElement { }
    customElements.define('deferring-card', DeferringCard);
    _defineServerRender(DeferringCard, await compile('<h2>Card</h2>@defer (interaction) {<b>content</b>} @placeholder {<button>Load</button>} @loading {<i>loading</i>} @error {<s>error</s>}@defer (idle) {<b>content</b>}'));

    expect(await renderToString(DeferringCard)).toContain('<h2>Card</h2><!--xd-d--><button>Load</button><!--/xd-d--><!--xd-d--><!--/xd-d--></template>');
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
      `<!--${markers.defer}--> h <!--/${markers.defer}-->`
    ].join(''));
  });

  it('applies the custom directives of a native element, the ones of its selected branches included: onInit and @HostProperty run, the effects do not, the content assigned to innerHTML follows the start tag', async () => {
    const directiveEffect = vi.fn();
    const fillMetadata: DecoratorMetadataObject = {};
    (HostProperty('class.filled') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'filled', static: false, metadata: fillMetadata, access: { get: (owner: { filled: boolean }) => owner.filled } });

    /**
     * A directive filling its element with the HTML of its input, on the server only.
     */
    class FillDirective extends CustomDirective {
      public content = (Property('') as unknown as (target: unknown, context: unknown) => { init(this: object): () => string })({}, { name: 'content', metadata: fillMetadata }).init.call(this);
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
      expect(await renderIsland('static-three', '<island-card [class.kind]="{ true }" @if (true) { first="{ 2 }" }></island-card>')).toContain('data-xd-inputs="{&quot;start&quot;:2}"');
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
    // @ts-expect-error an input declaring an alias is not passed by the name of its property
    await expect(renderToString(CrossedElement, { internalValue: 'x' })).rejects.toThrow('"internalValue" is the property of an input of CrossedElement declaring an alias: bind it by its alias');
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

  it('writes the event contract right after the element, before the transfer state, with the events of the components of the page', async () => {
    class Listening extends CustomElement { }
    class Nested extends CustomElement { }
    Object.defineProperty(Nested, Symbol.for('Symbol.metadata'), { value: { hostEvents: [{ name: 'pointerenter' }] } });
    customElements.define('listening-root', Listening);
    customElements.define('listening-nested', Nested);
    _defineServerRender(Listening, await compile('<button (pointerdown)="noop()"></button><listening-nested></listening-nested>'));
    _defineServerRender(Nested, await compile('<p></p>'));

    const html = await ssr.renderToString(Listening, undefined, { state: { a: 1 } });

    expect(html).toMatch(/<\/listening-root><script>\(.*"pointerdown","pointerenter".*<\/script><script type="application\/json" data-xd-state>/s);
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
});
