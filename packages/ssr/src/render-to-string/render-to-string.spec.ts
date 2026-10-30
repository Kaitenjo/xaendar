import { describe, expect, it, vi } from 'vitest';
import type { ServerRenderFunction } from '../utils/server-render-registry/server-render-registry.util';

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
const { CustomElement, HostProperty, Property, StructuralDirective, _defineDirective, _getComponentRuntime } = core;
const { renderToString, _defineServerRender } = ssr;

/**
 * Compiles a template for the server and evaluates its code, the imports of the runtime helpers given as parameters.
 */
async function compile(source: string, signals: string[] = [], shadowingMembers: string[] = []): Promise<ServerRenderFunction> {
  const code = await compileServer(source, { signals, shadowingMembers, cache: undefined as never });
  const body = `${code.split('\n').filter(line => !line.startsWith('import ')).join('\n')}\nreturn render;`;
  const helpers: Record<string, unknown> = Object.assign({}, core, ssr);
  return new Function(...Object.keys(helpers), body)(...Object.values(helpers));
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
  '  <user-badge label="{ user().name }" admin="{ user().admin }">#{ index() }</user-badge>',
  '</template>',
  '@if (users().length) {',
  '  @for (user of users(); track user().id) {',
  '    @render row(user(), $index())',
  '  }',
  '} @else {',
  '  <p>Nobody</p>',
  '}',
  '@let total = users().length;',
  '@switch (kind) { @case (\'a\') { <i>a</i> } @case (\'b\', \'c\') { <i>{ total() }</i> } @default { <i>?</i> } }',
  '<p @if (total() > 1) { title="many" } @else { title="few" }>{ typeof window } { innerWidth }</p>',
  '<input #field value="{ field }" />',
  '<b *delay(allow="{ true }")>late</b><b *delay(allow="{ false }")>never</b>',
  '<style>a > b {}</style>',
  '<lazy-element></lazy-element>'
].join(''), ['heading', 'users'], ['name']));

describe('renderToString', () => {
  it('renders a component with its inputs, as declarative shadow roots, the components it renders included', async () => {
    const html = await renderToString(TeamElement, { heading: 'Our team' });

    expect(html).toBe([
      '<team-list><template shadowrootmode="open">',
      '<h1 class="title long">Our team &amp; team</h1>',
      '<user-badge class="admin"><template shadowrootmode="open"><style>:host { display: block }</style><span>Ada</span><slot></slot></template>#0</user-badge>',
      '<user-badge><template shadowrootmode="open"><style>:host { display: block }</style><span>Bob &lt;2&gt;</span><slot></slot></template>#1</user-badge>',
      '<i>2</i>',
      '<p title="many">undefined undefined</p>',
      '<input value="undefined">',
      '<b>late</b>',
      '<style>a > b </style>',
      '<lazy-element></lazy-element>',
      '</template></team-list>'
    ].join(''));
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

  it('throws when the component has no template compiled for the server', async () => {
    class ClientOnlyElement extends CustomElement { }
    customElements.define('client-only-root', ClientOnlyElement);

    await expect(renderToString(ClientOnlyElement)).rejects.toThrow('ClientOnlyElement has no template compiled for the server');
  });
});
