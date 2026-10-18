import { isEmpty } from '@xaendar/common';

isEmpty({});                     // true
isEmpty({ page: 1 });            // false
isEmpty({ page: undefined });    // false: the key counts, whatever its value
isEmpty([]);                     // true: an array is an object, its indexes are its keys
isEmpty(new Map([['page', 1]])); // true: the entries of a Map are not properties, check its size
isEmpty({ [Symbol('id')]: 1 });  // true: symbol keys are not counted
