import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `computed-equals.ts`, shown by the API reference of core-signals.
 */
export const COMPUTED_EQUALS: SourceFile = {
  name: 'computed-equals.ts',
  lang: 'ts',
  code: `/**
 * The names of the tasks done. Every evaluation returns a new array: compared by content, a change that leaves the
 * same names notifies nobody.
 */
public readonly doneNames = computed(() => this._computeDoneNames(), {
  equals: (current: string[], next: string[]) =>
    current.length === next.length && current.every((name, index) => name === next[index])
});

/**
 * Computes the value of \`doneNames\`.
 *
 * @returns The names of the tasks done, in order.
 */
private _computeDoneNames(): string[] {
  return this.tasks().filter(task => task.done).map(task => task.name);
}`
};

/**
 * The snippet `computed-member.ts`, shown by the API reference of core-signals.
 */
export const COMPUTED_MEMBER: SourceFile = {
  name: 'computed-member.ts',
  lang: 'ts',
  code: `import { CustomElement } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A cart, whose total follows its items.
 */
export class CartComponent extends CustomElement {
  /**
   * The items in the cart.
   */
  public readonly items = signal<Array<{ name: string; price: number }>>([]);
  /**
   * The total price, derived from the items.
   */
  public readonly total = computed(() => this._computeTotal());

  /**
   * Adds an item. The total is not computed now, but at its next read.
   *
   * @param name - The name of the item.
   * @param price - Its price.
   */
  public add(name: string, price: number): void {
    this.items.update(items => [...items, { name, price }]);
  }

  /**
   * Computes the value of \`total\`.
   *
   * @returns The sum of the prices.
   */
  private _computeTotal(): number {
    return this.items().reduce((sum, item) => sum + item.price, 0);
  }
}`
};

/**
 * The snippet `effect-batching.ts`, shown by the API reference of core-signals.
 */
export const EFFECT_BATCHING: SourceFile = {
  name: 'effect-batching.ts',
  lang: 'ts',
  code: `import { effect, signal } from '@xaendar/core/signals';

/**
 * The first name.
 */
const first = signal('Ada');
/**
 * The last name.
 */
const last = signal('Lovelace');

effect(() => console.log(\`\${first()} \${last()}\`)); // now, synchronously: "Ada Lovelace"

first.set('Grace');
last.set('Hopper');
// a single run for both writes, in a microtask: "Grace Hopper"`
};

/**
 * The snippet `effect-cleanup.ts`, shown by the API reference of core-signals.
 */
export const EFFECT_CLEANUP: SourceFile = {
  name: 'effect-cleanup.ts',
  lang: 'ts',
  code: `import { effect, signal } from '@xaendar/core/signals';

/**
 * The text to search for.
 */
const query = signal('');
/**
 * The search scheduled by the last run.
 */
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Searches 300 ms after the last change of the text.
 */
const dispose = effect(() => {
  clearTimeout(timer);                       // the cleanup of the previous run, at the start of this one
  const text = query();
  timer = setTimeout(() => search(text), 300);
}, {
  onCleanup: () => clearTimeout(timer)       // once, when the effect is disposed
});

dispose();`
};

/**
 * The snippet `effect-component.ts`, shown by the API reference of core-signals.
 */
export const EFFECT_COMPONENT: SourceFile = {
  name: 'effect-component.ts',
  lang: 'ts',
  code: `import { CustomElement } from '@xaendar/core';
import { effect, signal } from '@xaendar/core/signals';

/**
 * The text being written, shared by the whole application.
 */
const draft = signal('');

// A standalone effect at module level: it runs as long as the page, or until its disposer is called
effect(() => localStorage.setItem('draft', draft()));

/**
 * A counter of the characters of the draft.
 */
export class DraftCounterComponent extends CustomElement {
  /**
   * Logs the length of the draft while the component is on the page.
   */
  public onInit(): void {
    // ✓ Disposed when the component leaves the page
    this.effect(() => console.log(draft().length));

    // ✗ Keeps running after the component leaves the page, and a new one starts at every connection
    effect(() => console.log(draft().length));
  }
}`
};

/**
 * The snippet `input-local-copy.ts`, shown by the API reference of core-signals.
 */
export const INPUT_LOCAL_COPY: SourceFile = {
  name: 'input-local-copy.ts',
  lang: 'ts',
  code: `/**
 * The value bound by the parent.
 */
@Property(0)
public accessor value!: InputSignal<number>;
/**
 * The value shown, which the component changes too.
 */
public readonly current = signal(0);

/**
 * Copies every value the parent binds into the local signal.
 */
public onInit(): void {
  this.effect(() => this.current.set(this.value()));
}

/**
 * Changes the local value: the input keeps the one of the parent.
 */
public increment(): void {
  this.current.update(current => current + 1);
}`
};

/**
 * The snippet `query-element.ts`, shown by the API reference of core-signals.
 */
export const QUERY_ELEMENT: SourceFile = {
  name: 'query-element.ts',
  lang: 'ts',
  code: `import type { QueryElement } from '@xaendar/core/signals';
import type { CounterBadgeComponent } from './counter-badge.xd.component';

/**
 * A selector: the element type given as second argument.
 */
type Field = QueryElement<'input[type=search]', HTMLInputElement>;    // HTMLInputElement

/**
 * A component class: its instances, whatever the second argument.
 */
type Badge = QueryElement<typeof CounterBadgeComponent, HTMLElement>; // CounterBadgeComponent`
};

/**
 * The snippet `query-signal-read.ts`, shown by the API reference of core-signals.
 */
export const QUERY_SIGNAL_READ: SourceFile = {
  name: 'query-signal-read.ts',
  lang: 'ts',
  code: `/**
 * The rows rendered by the @for of the template.
 */
@Query.all('.row')
public accessor rows!: QuerySignal<HTMLElement[]>;
/**
 * How many rows are shown: a computed signal reading the query follows it.
 */
public readonly count = computed(() => this._computeCount());

/**
 * Logs the rows whenever they change. The first run, before the render, sees an empty list.
 */
public onInit(): void {
  this.effect(() => console.log(this.rows().length));
}

/**
 * The rows are there: the query was filled right after the render.
 */
public afterRender(): void {
  this.rows()[0]?.focus();
}

/**
 * Computes the value of \`count\`.
 *
 * @returns The number of rows.
 */
private _computeCount(): number {
  return this.rows().length;
}`
};

/**
 * The snippet `query-slot-options.ts`, shown by the API reference of core-signals.
 */
export const QUERY_SLOT_OPTIONS: SourceFile = {
  name: 'query-slot-options.ts',
  lang: 'ts',
  code: `/**
 * The first element marked as header, among the elements assigned to any slot and their descendants.
 */
@Query.content('[header]')
public accessor header!: QuerySignal<HTMLElement | null>;
/**
 * The buttons assigned to the footer slot, and the ones inside them.
 */
@Query.content.all('button', { slots: 'footer' })
public accessor actions!: QuerySignal<HTMLElement[]>;
/**
 * The items of the default slot and of the aside slot: '' is the default slot.
 */
@Query.content.all('.item', { slots: ['', 'aside'] })
public accessor items!: QuerySignal<HTMLElement[]>;
/**
 * Every item among the descendants of the element, assigned to a slot or not, in document order.
 */
@Query.content.all('.item', { lightDom: true })
public accessor allItems!: QuerySignal<HTMLElement[]>;
/**
 * ✗ slots and lightDom: true exclude each other: the options do not compile.
 */
@Query.content.all('.item', { slots: 'aside', lightDom: true })
public accessor mixed!: QuerySignal<HTMLElement[]>;`
};

/**
 * The snippet `query-target-native.ts`, shown by the API reference of core-signals.
 */
export const QUERY_TARGET_NATIVE: SourceFile = {
  name: 'query-target-native.ts',
  lang: 'ts',
  code: `/**
 * ✗ A native class is not a component: it has no selector.
 */
@Query(HTMLInputElement)
public accessor field!: QuerySignal<HTMLInputElement | null>;
// It compiles, but creating the component throws:
// Error: HTMLInputElement does not seem to be decorated with @WebComponent

/**
 * ✓ A tag name, with the type of the element as type argument.
 */
@Query<HTMLInputElement>('input')
public accessor field!: QuerySignal<HTMLInputElement | null>;`
};

/**
 * The snippet `signal-component.ts`, shown by the API reference of core-signals.
 */
export const SIGNAL_COMPONENT: SourceFile = {
  name: 'signal-component.ts',
  lang: 'ts',
  code: `// counter.xd.component.ts
import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A counter.
 */
@WebComponent({
  selector: 'ex-counter',
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  /**
   * The current count. Initialized with signal(): the template compiler knows it is a signal.
   */
  public readonly count = signal(0);

  /**
   * Adds one to the count.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }
}`
};

/**
 * The snippet `signal-equals.ts`, shown by the API reference of core-signals.
 */
export const SIGNAL_EQUALS: SourceFile = {
  name: 'signal-equals.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';

/**
 * A name compared without case.
 */
const name = signal('Ada', {
  equals: (current: string, next: string) => current.toLowerCase() === next.toLowerCase()
});

name.set('ADA');   // equal: ignored, nobody is notified
name();            // 'Ada': the old value is kept
name.set('Grace');
name();            // 'Grace'`
};

/**
 * The snippet `signal-identity.ts`, shown by the API reference of core-signals.
 */
export const SIGNAL_IDENTITY: SourceFile = {
  name: 'signal-identity.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';

/**
 * The fruits in the basket.
 */
const fruits = signal(['apple']);

// ✗ The array changes, but the signal holds the same reference: nobody is notified
fruits().push('pear');

// ✗ The same reference again: equal by Object.is, ignored
fruits.set(fruits());

// ✓ A new array is a new value
fruits.update(list => [...list, 'pear']);`
};

/**
 * The snippet `signal-watched.ts`, shown by the API reference of core-signals.
 */
export const SIGNAL_WATCHED: SourceFile = {
  name: 'signal-watched.ts',
  lang: 'ts',
  code: `import { signal } from '@xaendar/core/signals';

/**
 * Whether the page is visible, followed only while something depends on it.
 */
const visible = signal(document.visibilityState === 'visible', {
  watched: () => {
    document.addEventListener('visibilitychange', refresh);
    queueMicrotask(refresh); // signals are frozen here: the write is deferred
  },
  unwatched: () => document.removeEventListener('visibilitychange', refresh)
});

/**
 * Copies the visibility of the page into the signal.
 */
function refresh(): void {
  visible.set(document.visibilityState === 'visible');
}`
};

/**
 * The snippet `untracked-call.ts`, shown by the API reference of core-signals.
 */
export const UNTRACKED_CALL: SourceFile = {
  name: 'untracked-call.ts',
  lang: 'ts',
  code: `/**
 * Loads the user again whenever userId changes.
 */
public onInit(): void {
  this.effect(() => {
    const id = this.userId();        // the only dependency of the effect
    untracked(() => this._load(id)); // the signals _load reads before its first await are not dependencies
  });
}`
};

/**
 * The snippet `untracked-read.ts`, shown by the API reference of core-signals.
 */
export const UNTRACKED_READ: SourceFile = {
  name: 'untracked-read.ts',
  lang: 'ts',
  code: `/**
 * Sends every new message, signed by the user logged in at that moment.
 */
public onInit(): void {
  this.effect(() => {
    const message = this.message();            // tracked: a new message runs the effect again
    const user = untracked(() => this.user()); // untracked: switching user does not
    send(\`\${user}: \${message}\`);
  });
}`
};
