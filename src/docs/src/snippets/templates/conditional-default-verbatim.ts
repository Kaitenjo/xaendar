// volume.xd.component.ts
const DEFAULT_LEVEL = 50;

@Property(DEFAULT_LEVEL)                 // the default, written as an identifier
public accessor level!: InputSignal<number>;

// player.xd.component.html
// <ex-volume @if (linked()) { level="{ level() }" } />
//
// The default is copied as written into the code of the player, where DEFAULT_LEVEL does not exist:
// ReferenceError: DEFAULT_LEVEL is not defined
//
// ✓ write the default as a literal: @Property(50)
