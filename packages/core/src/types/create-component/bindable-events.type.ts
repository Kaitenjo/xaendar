import type { Function } from '@xaendar/types';
import type { Output } from '../../models/output/output';

/**
 * The events listened to by `createComponent` on the element of a component or of a directive, each one with its listener:
 * the outputs of the component or of the directive, and the native events of an HTML element.
 *
 * @template Target - The component or the directive dispatching the events.
 */
export type BindableEvents<Target> = OutputListeners<Target> & NativeListeners;

/**
 * The listeners of the outputs of a component or of a directive, by the name of their `@Event` accessor.
 *
 * Written as a mapped type over `keyof Target`, filtering the names in the `as` clause: this form lets TypeScript give the
 * listeners their type while it infers the type of a directive from its entry.
 *
 * @template Target - The component or the directive declaring the outputs.
 */
type OutputListeners<Target> = {
  [Name in keyof Target as OutputName<Target, Name>]?: OutputListener<Target[Name]>
};

/**
 * The listeners of the native events of an HTML element, by event name.
 */
type NativeListeners = {
  [Name in keyof HTMLElementEventMap]?: Function<[event: HTMLElementEventMap[Name]], unknown>
};

/**
 * The name of a member when it is an output, `never` otherwise. `condition` is never one, since it is the key giving the
 * condition of a group of bindings.
 *
 * @template Target - The component or the directive declaring the member.
 * @template Name - The name of the member.
 */
type OutputName<Target, Name extends keyof Target> = Name extends 'condition' ? never : Target[Name] extends Output<never> ? Name : never;

/**
 * The listener of an output: it receives the event dispatched by the output, whose detail is the value the output emits.
 *
 * Any other member gets `unknown`, which leaves the type of a native event alone: TypeScript reads the type of the listener
 * of a name also from this side of `BindableEvents`, the native `click` included, even if it has no output with that name.
 *
 * @template Member - The member of the component or of the directive.
 */
type OutputListener<Member> = Member extends Output<never> ? Function<[event: CustomEvent<OutputDetail<Member>>], unknown> : unknown;

/**
 * The detail of the events dispatched by an output: the value it emits, `void` for an output emitting none.
 *
 * @template Emitter - The output dispatching the events.
 */
type OutputDetail<Emitter> = Emitter extends Output<infer Value> ? Value : void;
