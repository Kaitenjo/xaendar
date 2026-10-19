/**
 * Reads no signal: written once, each time the element is connected.
 */
@HostProperty('role')
public readonly hostRole = 'switch';
/**
 * Holds a signal: called to get the value, and written again when it changes. The host has the class on while it is true.
 */
@HostProperty('class.on')
public readonly on = signal(false);
/**
 * An input reflected on the host: the accessor holds an InputSignal, called as well.
 */
@HostProperty('size')
@Property<InputSignal<'small' | 'large'>>('small')
public accessor size!: InputSignal<'small' | 'large'>;

/**
 * Written again whenever a signal it reads changes.
 *
 * @returns The label read by assistive technologies.
 */
@HostProperty('aria-label')
public get stateLabel(): string {
  return this.on() ? 'Turn off' : 'Turn on';
}
