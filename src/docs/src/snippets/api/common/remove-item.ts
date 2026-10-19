import { removeItem } from '@xaendar/common';

/**
 * The ids of the selected rows.
 */
const selected = [3, 7, 9, 7];

removeItem(selected, 7); // true: selected is now [3, 9, 7], only the first 7 is removed
removeItem(selected, 4); // false: selected is left as it is
