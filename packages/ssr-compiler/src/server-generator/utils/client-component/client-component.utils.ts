import type { ComponentMetadata, ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/**
 * Tells whether what a template imports is a component rendering only in the browser.
 *
 * @param metadata - The metadata of the component or directive.
 * @returns `true` for a component declaring `ssr: { render: false }`.
 */
export function isClientComponent(metadata: ComponentOrDirectiveMetadata): metadata is ComponentMetadata {
  return metadata.type === 'component' && !!metadata.clientOnly;
}
