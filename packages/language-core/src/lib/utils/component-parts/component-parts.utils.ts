import { collectTemplateParts, type ComponentOrDirectiveMetadata, type ComponentParts, parseTemplate } from '@xaendar/compiler';
import { dirname, resolve } from 'node:path';
import { readDocument } from '../../language-service/language-service';
import { normalizeFileName } from '../path/path.utils';

/**
 * The parts of the templates read so far, by the path of the template, with the text they were read from.
 *
 * N.B. Keyed by the text of the template, not by the file of the component: the template of a component can change
 * without its class, which the caches of the metadata are keyed by. Do not store the parts in the metadata.
 */
const templateParts = new Map<string, { readonly text: string, readonly parts: ComponentParts | undefined }>();

/**
 * Gives the parts a component exposes to `::part()` (see `ComponentParts`): the ones its manifest lists, for a
 * component of a compiled library, the ones its template declares, for a component of the project, read with its unsaved
 * changes (see `readDocument`), and none for a customized built-in element without a template.
 *
 * @param metadata - The metadata of the component.
 * @param read - Reads a file, `undefined` when it cannot be read.
 * @returns The parts, `undefined` when they are not known: a directive, a manifest listing none, a template that
 *   cannot be read or parsed.
 */
export function getComponentParts(metadata: ComponentOrDirectiveMetadata, read: (fileName: string) => string | undefined = readDocument): ComponentParts | undefined {
  if (metadata.type !== 'component') {
    return undefined;
  }

  if ('library' in metadata) {
    return metadata.parts;
  }

  const { templateUrl, modulePath } = metadata;
  if (!templateUrl) {
    return { names: [] };
  }

  const path = resolve(dirname(modulePath), templateUrl);
  const text = read(path);
  if (text === undefined) {
    return undefined;
  }

  const key = normalizeFileName(path);
  const cached = templateParts.get(key);
  if (cached?.text === text) {
    return cached.parts;
  }

  let parts: ComponentParts | undefined;
  try {
    parts = collectTemplateParts(parseTemplate(text));
  } catch {
    // A template that cannot be parsed exposes no part the editor can tell
    parts = undefined;
  }

  templateParts.set(key, { text, parts });
  return parts;
}
