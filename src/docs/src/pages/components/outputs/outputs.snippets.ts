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
public accessor language!: InputSignal<string>;`
};
