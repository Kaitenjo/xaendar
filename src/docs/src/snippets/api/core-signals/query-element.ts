import type { QueryElement } from '@xaendar/core/signals';
import type { CounterBadgeComponent } from './counter-badge.xd.component';

/**
 * A selector: the element type given as second argument.
 */
type Field = QueryElement<'input[type=search]', HTMLInputElement>;    // HTMLInputElement

/**
 * A component class: its instances, whatever the second argument.
 */
type Badge = QueryElement<typeof CounterBadgeComponent, HTMLElement>; // CounterBadgeComponent
