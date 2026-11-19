/**
 * The event a name given to `@HostListener` listens to, after the prefix naming its target: `keydown` or `keyup` for a
 * key event, which names its key after a dot (`keydown.enter`), the name itself otherwise.
 *
 * @template Name - The name, without the prefix naming its target.
 */
export type HostListenerEventName<Name extends string> = Name extends `${infer Event extends 'keydown' | 'keyup'}.${string}` ? Event : Name;
