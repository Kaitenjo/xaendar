/**
 * Loads the user again whenever userId changes.
 */
public onInit(): void {
  this.effect(() => {
    const id = this.userId();        // the only dependency of the effect
    untracked(() => this._load(id)); // the signals _load reads before its first await are not dependencies
  });
}
