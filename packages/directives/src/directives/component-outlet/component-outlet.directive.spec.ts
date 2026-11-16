// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

// The namespace keeps the type of the symbol, which destructuring widens
const core = await import('@xaendar/core');
const { _resolveDirective, _setInput, CustomDirective, CustomElement } = core;
const { ComponentOutlet } = await import('./component-outlet.directive');

type Outlet = InstanceType<typeof ComponentOutlet<InstanceType<typeof CustomElement>>>;

/**
 * A component class to create, which the spy of `createComponent` never instantiates.
 */
class FirstComponent extends CustomElement { }

/**
 * Another component class to create.
 */
class SecondComponent extends CustomElement { }

/**
 * Creates the directive applied to a new element, with the inputs given, as a template binds them. Its `createComponent`
 * is a spy returning a reference of its own for each call, so that what the directive asks for and destroys can be checked.
 */
function apply(inputs: Record<string, unknown>) {
  const element = document.createElement('div');
  const directive = new ComponentOutlet();
  directive[core._SET_DIRECTIVE_ELEMENT] = element;
  const refs = new Array<{ element: HTMLElement, destroy: ReturnType<typeof vi.fn> }>();
  const createComponent = vi.spyOn(directive, 'createComponent').mockImplementation(() => {
    const ref = { element: document.createElement('span'), destroy: vi.fn() };
    refs.push(ref);

    return ref as never;
  });
  for (const name in inputs) {
    setInput(directive, name, inputs[name]);
  }

  return { directive, element, createComponent, refs };
}

/**
 * Sets an input of the directive, as a template binding a literal does.
 */
function setInput(directive: Outlet, name: string, value: unknown): void {
  _setInput(undefined as never, directive, { name, value } as never);
}

/**
 * Lets the effects scheduled by a change run.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

describe('ComponentOutlet', () => {
  it('is the custom directive of the selector componentOutlet', () => {
    expect(_resolveDirective('componentOutlet', CustomDirective)).toBe(ComponentOutlet);
  });

  it('creates nothing until it starts', () => {
    const { createComponent } = apply({ component: FirstComponent });

    expect(createComponent).not.toHaveBeenCalled();
  });

  it('creates the component without options as it starts, leaving the target to createComponent', () => {
    const { directive, createComponent } = apply({ component: FirstComponent });

    directive.onInit();

    expect(createComponent).toHaveBeenCalledOnce();
    expect(createComponent).toHaveBeenCalledWith(FirstComponent, undefined);
  });

  it('creates the component with the options given as they are', () => {
    const target = document.createElement('section');
    const options = { target, content: [document.createTextNode('projected')] };
    const { directive, createComponent } = apply({ component: FirstComponent, options });

    directive.onInit();

    expect(createComponent).toHaveBeenCalledOnce();
    expect(createComponent.mock.calls[0][0]).toBe(FirstComponent);
    expect(createComponent.mock.calls[0][1]).toBe(options);
  });

  it('creates the component with options that have no target', () => {
    const options = { properties: [{ label: () => 'a' }] };
    const { directive, createComponent } = apply({ component: FirstComponent, options });

    directive.onInit();

    expect(createComponent.mock.calls[0][1]).toBe(options);
    expect(createComponent.mock.calls[0][1]).not.toHaveProperty('target');
  });

  it('destroys the component and creates it again when the class changes', async () => {
    const { directive, createComponent, refs } = apply({ component: FirstComponent });
    directive.onInit();

    setInput(directive, 'component', SecondComponent);
    await flush();

    expect(createComponent).toHaveBeenCalledTimes(2);
    expect(createComponent.mock.calls[1][0]).toBe(SecondComponent);
    expect(refs[0].destroy).toHaveBeenCalledOnce();
    expect(refs[1].destroy).not.toHaveBeenCalled();
  });

  it('destroys the component and creates it again when the options change', async () => {
    const first = { content: [document.createTextNode('first')] };
    const second = { content: [document.createTextNode('second')] };
    const { directive, createComponent, refs } = apply({ component: FirstComponent, options: first });
    directive.onInit();

    setInput(directive, 'options', second);
    await flush();

    expect(createComponent).toHaveBeenCalledTimes(2);
    expect(createComponent.mock.calls[1][1]).toBe(second);
    expect(refs[0].destroy).toHaveBeenCalledOnce();
    expect(refs[1].destroy).not.toHaveBeenCalled();
  });

  it('creates the component again with no options when they are removed', async () => {
    const { directive, createComponent, refs } = apply({ component: FirstComponent, options: { content: [] } });
    directive.onInit();

    setInput(directive, 'options', undefined);
    await flush();

    expect(createComponent).toHaveBeenCalledTimes(2);
    expect(createComponent.mock.calls[1][1]).toBeUndefined();
    expect(refs[0].destroy).toHaveBeenCalledOnce();
  });

  it('does not create the component again when an input is set to the value it has', async () => {
    const { directive, createComponent, refs } = apply({ component: FirstComponent });
    directive.onInit();

    setInput(directive, 'component', FirstComponent);
    await flush();

    expect(createComponent).toHaveBeenCalledOnce();
    expect(refs[0].destroy).not.toHaveBeenCalled();
  });

  it('destroys the component when it is destroyed', () => {
    const { directive, refs } = apply({ component: FirstComponent });
    directive.onInit();

    directive.onDestroy();

    expect(refs[0].destroy).toHaveBeenCalledOnce();
  });

  it('destroys nothing when it is destroyed before it started', () => {
    const { directive, refs } = apply({ component: FirstComponent });

    expect(() => directive.onDestroy()).not.toThrow();
    expect(refs).toHaveLength(0);
  });
});
