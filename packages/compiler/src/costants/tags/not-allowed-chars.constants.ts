/**
 * List of characters that are not allowed in a custom element tag name.
 * 
 * These characters are forbidden according to the Custom Elements specification
 * and will make a tag name invalid if included.
 */
export const NOT_ALLOWED_CHARS_FOR_TAGS = [
  '@',
  '#',
  '$',
  '%',
  '&',
  '*',
  '!',
  '?',
  '/',
  '\\',
  '|',
  "'",
  '"',
  '<',
  '>',
  '='
];