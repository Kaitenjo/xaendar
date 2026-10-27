---
name: test
description: Write and run the specs of a Xaendar project with xd test (Vitest in happy-dom, with the Xaendar plugins and the Signal polyfill installed). Use when adding, fixing or running tests of components, directives or stores, or when a spec fails with "does not seem to have a Render Function".
argument-hint: component, directive or spec file
allowed-tools: Bash(npx xd test*), Bash(npx xd build*), Read, Grep, Glob
---

# Test a Xaendar project

Arguments: `$ARGUMENTS` (what to test or which spec to fix; every spec when empty).

`xd test` runs every `*.spec.ts` of the project once (it watches only in an interactive terminal) with the plugins of `xd build`, in happy-dom, after `loadSignals()`. It takes no file filter. Plain `vitest` cannot compile the components.

## Writing a spec

- Put `<name>.xd.component.spec.ts` next to the component and import its class: the module defines the element, and its template defines the components it imports. Use the class as a value (`instanceof`, as below): an import used only as a type (`as CounterComponent`) is dropped, the element is never defined, and `shadowRoot` is `null`.
- Mount by tag. The first render is synchronous; after a change, `await flush()` before reading the DOM, a query or what an effect writes:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { CounterComponent } from './counter.xd.component';

/**
 * Waits for the effects, the template updates and the queries, which run in microtasks.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the component as a page does.
 */
function mount(): CounterComponent {
  const element = document.createElement('app-counter');
  if (!(element instanceof CounterComponent)) {
    throw new Error('app-counter is not defined');
  }

  document.body.append(element);
  return element;
}

describe('CounterComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('counts the clicks', async () => {
    const element = mount();

    element.shadowRoot!.querySelector('button')!.click();
    await flush();

    expect(element.count()).toBe(1);
    expect(element.shadowRoot!.textContent).toContain('1');
  });
});
```

- Drive the component through its public members (signals, methods, queries) and the DOM of `element.shadowRoot`, with real events: `button.click()`, `element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))`.
- Outputs: `element.addEventListener('changed', listener)`; the value is in `event.detail`.
- Inputs: a tag mounted by the spec keeps its defaults (required inputs are `undefined`), since attributes never reach inputs. Test a component with inputs through a host: its real parent, or a host component written for the spec next to it, whose template binds the inputs to its signals and records the outputs:

```html
<!-- counter-host.xd.component.html -->
@import { CounterComponent } from './counter.xd.component.ts'

<app-counter start="{start()}" label="Clicks" (changed)="record($event)" />
```

```ts
// counter-host.xd.component.ts
@WebComponent({
  selector: 'app-counter-host',
  templateUrl: './counter-host.xd.component.html'
})
export class CounterHostComponent extends CustomElement {
  public readonly start = signal(5);
  public readonly totals = new Array<number>();

  public record(event: CustomEvent<number>): void {
    this.totals.push(event.detail);
  }
}
```

  Mount the host, read the child with `host.shadowRoot!.querySelector('app-counter')` (check it with `instanceof`), then `host.start.set(10); await flush();`.
- A directive is tested through a host component applying it, in the same way.
- A store is tested by calling its functions and reading its signals; effects that read it need `await flush()`. Its state survives between tests: reset it in `afterEach`.
- `afterEach(() => document.body.replaceChildren())` disconnects the components: `onDestroy` runs and the effects are disposed.
- Never import the `_`-prefixed helpers of `@xaendar/core` (`_Context`, `_setExpressionProperty`): they are the API of the compiled templates.
- happy-dom computes no layout (`offsetWidth`, `getBoundingClientRect` are 0: define them on the element with `Object.defineProperty`) and has no `ElementInternals` (stub `attachInternals` on `HTMLElement.prototype` in a `beforeAll`).

## Running

1. From the project folder: `npx xd test 2>&1`.
2. Template errors are printed as `Xaendar:` blocks above the results (on stderr): a spec failing with `<Class> does not seem to have a Render Function`, or with a `TypeError` thrown from `virtual:xaendar-template`, has one. Look them up in `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/errors.md` and fix them; `npx xd build 2>&1` also reports the type errors of the whole project.
3. Report the passed and failed specs, each failure with `file:line` and its cause, and what you fixed.
