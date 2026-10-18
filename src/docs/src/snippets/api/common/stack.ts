import { Stack } from '@xaendar/common';

/**
 * The tags opened and not closed yet, the innermost on top.
 */
const openTags = new Stack<string>();

openTags.push('ul');           // 1, the new length
openTags.push('li');           // 2
openTags[0];                   // 'ul': indexes count from the bottom
openTags[openTags.length - 1]; // 'li': the top
openTags.values.join(' > ');   // 'ul > li': a copy, from the bottom
openTags.pop();                // 'li'
openTags.pop();                // 'ul'
openTags.pop();                // undefined: the stack is empty
