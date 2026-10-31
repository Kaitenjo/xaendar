import type { Span } from '../../types/span.type.js';
import type { LineMapping } from './line-mapping.type.js';

/**
 * A fragment of a line: a static string, or a text mapped onto the span of the template it comes from,
 * optionally together with finer mappings of its parts.
 */
export type LinePart = string | { text: string; span: Span; segments?: readonly LineMapping[] };
