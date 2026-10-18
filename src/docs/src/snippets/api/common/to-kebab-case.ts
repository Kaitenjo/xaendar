import { toKebabCase } from '@xaendar/common';

toKebabCase('UserCard');  // 'user-card'
toKebabCase('userCard');  // 'user-card'
toKebabCase('user_card'); // 'user-card'
toKebabCase('parseXML');  // 'parse-xml'
toKebabCase('XMLParser'); // 'xmlparser': a run of capitals is not split
