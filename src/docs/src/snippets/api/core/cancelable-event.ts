/**
 * Declared with @Event, so that templates can listen to it: (closing)="confirmClose($event)".
 */
@Event({ cancelable: true })
public accessor closing!: Output;
/**
 * Whether the dialog is open.
 */
public readonly open = signal(true);

/**
 * Closes the dialog, unless a listener cancels the closing.
 */
public close(): void {
  // emit() returns nothing: dispatchEvent() tells whether a listener called preventDefault()
  const allowed = this.dispatchEvent(new CustomEvent('closing', { cancelable: true }));
  if (allowed) {
    this.open.set(false);
  }
}
