import { values } from '@xaendar/common';

/**
 * The unread messages, by folder.
 */
const unread = { inbox: 3, archive: 0, spam: 12 };

values(unread);                                        // [3, 0, 12], typed number[]
values(unread).reduce((sum, count) => sum + count, 0); // 15
values(undefined);                                     // undefined
