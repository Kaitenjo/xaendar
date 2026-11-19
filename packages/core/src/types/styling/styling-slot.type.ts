import type { _RenderStyling } from './render-styling.type';
import type { StylingState } from './styling-state.type';
import type { TemplateStyling } from './template-styling.type';

/**
 * What an element keeps of the sources of its `class` or of its `style` (see `ElementSources`):
 * - `null`: nothing, the template writing the attribute directly, without looking for the host attributes;
 * - `true`: a host attribute may write the attribute, so the binding of the template keeps itself here when it runs;
 * - the binding of the template, alone when its expressions computed no value (a static string), otherwise with the
 *   values they computed (see `TemplateStyling`), so that a host attribute writing one of its keys finds its opinions;
 * - the state merging the sources (see `StylingState`), once two of them have an opinion on the same key.
 *
 * N.B. Deliberate, to save memory: the binding of the template is kept alone when it has no values, and the state
 * replaces it only when two sources have an opinion on the same key, so that an element whose sources write different
 * keys keeps no state. Do not create the state as soon as a second source may write the attribute.
 */
export type StylingSlot = StylingState | TemplateStyling | _RenderStyling | true | null;
