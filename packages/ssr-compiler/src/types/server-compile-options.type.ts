import type { CompileOptions } from '@xaendar/compiler';

/**
 * The options of {@link compileServer}: the ones of `compile` generating the code of the client, `signals` required.
 */
export type ServerCompileOptions = Pick<CompileOptions, 'templateDir' | 'shadowingMembers' | 'customElements' | 'cache'> & Required<Pick<CompileOptions, 'signals'>> & {
  /**
   * The tag names of the interactive components the template renders, when the template is the one of a static component:
   * they hydrate by themselves, from the inputs written on their element.
   */
  readonly islands?: ReadonlySet<string>;
};
