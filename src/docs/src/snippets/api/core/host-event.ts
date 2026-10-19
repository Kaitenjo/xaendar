/**
 * A method without parameters: the event is not needed.
 */
@HostEvent('click')
public toggle(): void {
  this.on.update(on => !on);
}

/**
 * The parameter gives the type of the event.
 *
 * @param event - The key pressed while the host has the focus.
 */
@HostEvent('keydown')
public onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case ' ':
    case 'Enter':
      event.preventDefault();
      this.toggle();
      break;
  }
}

/**
 * An output of the component itself is dispatched on the host too.
 *
 * @param event - The output, with its detail.
 */
@HostEvent('checkedChange')
public log(event: CustomEvent<boolean>): void {
  console.log(event.detail);
}

/**
 * The options of addEventListener: capture, once and passive. The same method can listen to several events.
 */
@HostEvent('pointerup', { passive: true })
@HostEvent('pointercancel', { passive: true })
public release(): void {
  this.pressed.set(false);
}
