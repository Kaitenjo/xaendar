import { isValidCustomElementName } from '@xaendar/common';

isValidCustomElementName('user-card');    // true
isValidCustomElementName('x-1');          // true
isValidCustomElementName('my.card_v2-x'); // true: digits, dots and underscores are allowed
isValidCustomElementName('card');         // false: no hyphen
isValidCustomElementName('User-card');    // false: an uppercase letter
isValidCustomElementName('font-face');    // false: a reserved name
isValidCustomElementName('my-élément');   // false: only ASCII characters are accepted
isValidCustomElementName('card', false);  // false, without logging
