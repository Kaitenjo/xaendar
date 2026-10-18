/**
 * Sends every new message, signed by the user logged in at that moment.
 */
public onInit(): void {
  this.effect(() => {
    const message = this.message();            // tracked: a new message runs the effect again
    const user = untracked(() => this.user()); // untracked: switching user does not
    send(`${user}: ${message}`);
  });
}
