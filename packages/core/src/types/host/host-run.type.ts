import type { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import type { HostStylingRun } from '../../models/host-styling-run/host-styling-run';

/**
 * A run of the host attributes of a directive or of a component bound on its element: its attributes (see
 * `HostAttributeRun`), or its `class` or its `style` (see `HostStylingRun`). The runs of an element are registered with
 * it (see `ElementSources.hosts`), so that a state merging an attribute, created later, finds them.
 */
export type HostRun = HostStylingRun | HostAttributeRun;
