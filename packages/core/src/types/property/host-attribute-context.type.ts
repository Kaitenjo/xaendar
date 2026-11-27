import type { DecoratorMetadataContext } from '@xaendar/types';
import type { EventHost } from '../event/event-host.type';
import type { WebComponentMetadata } from '../web-component/web-component-metadata.type';

/**
 * The context of the accessor of an input reflecting it on the host, as `@HostAttribute` takes it: the input of a
 * structural directive is rejected when it is created, since the directive holds no element.
 */
export type HostAttributeContext = DecoratorMetadataContext<ClassAccessorDecoratorContext<EventHost, unknown>, WebComponentMetadata>;
