import { slice } from '@xaendar/common';

slice('Hello world', 0, 5);  // 'Hello'
slice('Hello world', 6);     // 'world'
slice('Hello world', -5);    // 'world'
slice('Hello world', 0, -6); // 'Hello'

/**
 * The source of a template, possibly long.
 */
const source = '<user-card name="Ada" />';
/**
 * The name of its first tag: a copy, which does not keep the source in memory.
 */
const tagName = slice(source, 1, source.indexOf(' ')); // 'user-card'
