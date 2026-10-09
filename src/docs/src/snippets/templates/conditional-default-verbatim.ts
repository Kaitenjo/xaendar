// volume.xd.component.ts
/**
 * The volume when nothing is bound.
 */
const DEFAULT_LEVEL = 50;

/**
 * The volume, with a default written as an identifier.
 */
@Property(DEFAULT_LEVEL)
public accessor level!: InputSignal<number>;

// player.xd.component.html
// <ex-volume @if (linked()) { level="{ level() }" } />
//
// The default is copied as written into the code of the player, where DEFAULT_LEVEL does not exist:
// ReferenceError: DEFAULT_LEVEL is not defined
//
// ✓ write the default as a literal: @Property(50)
