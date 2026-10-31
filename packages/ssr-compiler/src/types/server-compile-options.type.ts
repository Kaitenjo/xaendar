import type { CompileOptions } from '@xaendar/compiler';

/**
 * The options of {@link compileServer}: the ones of `compile` generating the code of the client, `signals` required.
 */
export type ServerCompileOptions = Pick<CompileOptions, 'templateDir' | 'shadowingMembers' | 'customElements' | 'cache'> & Required<Pick<CompileOptions, 'signals'>>;
