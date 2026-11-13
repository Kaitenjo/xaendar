import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `event-declaration.ts`, shown by the page components/outputs and the API reference of core.
 */
export const EVENT_DECLARATION: SourceFile = {
  name: 'event-declaration.ts',
  lang: 'ts',
  code: `/**
 * A CustomEvent named valueChange, carrying a number.
 */
@Event()
public accessor valueChange!: Output<number>;
/**
 * An Output<void>, with no detail. The options are the defaults of every emission.
 */
@Event({ bubbles: true, composed: true })
public accessor closed!: Output;

this.valueChange.emit(3);                                       // detail 3, default options
this.valueChange.emit(3, new EventOptions({ bubbles: true }));  // detail 3, options for this emission only
this.closed.emit();                                             // detail null
this.closed.emit(new EventOptions({ composed: false }));        // without a detail, the only argument is the options`
};

/**
 * The snippet `member-name-clash.ts`, shown by the page components/outputs and the API reference of core.
 */
export const MEMBER_NAME_CLASH: SourceFile = {
  name: 'member-name-clash.ts',
  lang: 'ts',
  code: `/**
 * ✗ Property 'remove' in type 'TodoItemComponent' is not assignable to the same property in base type 'CustomElement'.
 * ✗ Class 'CustomElement' defines instance member function 'remove', but extended class 'TodoItemComponent'
 *   defines it as instance member accessor.
 */
@Event()
public accessor remove!: Output<number>;

/**
 * ✗ Property 'title' in type 'ProfileComponent' is not assignable to the same property in base type 'CustomElement'.
 */
public readonly title = signal('Dr.');

/**
 * ✓ A name that HTMLElement does not use.
 */
@Event()
public accessor removed!: Output<number>;

/**
 * ✓ Another name for the member: templates still bind lang="…".
 */
@Property('ts', { alias: 'lang' })
public accessor language!: Aliased<InputSignal<string>, 'lang'>;`
};

/**
 * The snippet `model-declaration.ts`, shown by the page components/outputs and the API reference of core.
 */
export const MODEL_DECLARATION: SourceFile = {
  name: 'model-declaration.ts',
  lang: 'ts',
  code: `/**
 * A model named value: the parent binds it with [(value)]="quantity", and its event of change is valueChange.
 */
@Model(0)
public accessor value!: ModelSignal<number>;
/**
 * A required model bound by its alias, [(on)]="enabled": its event of change is onChange, and it bubbles.
 */
@Model.required({ alias: 'on', event: { bubbles: true } })
public accessor checked!: Aliased<ModelSignal<boolean>, 'on'>;

this.value();                           // reads it, as any input
this.value.set(3);                      // writes 3, and dispatches valueChange with detail 3
this.value.update(value => value + 1);  // writes 4, and dispatches valueChange with detail 4
this.value.set(4);                      // the same value: nothing changes, and no event is dispatched`
};