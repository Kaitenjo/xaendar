import { toPascalCase } from '@xaendar/common';

toPascalCase('user-card');   // 'UserCard'
toPascalCase('user_card');   // 'UserCard'
toPascalCase('userCard');    // 'UserCard'
toPascalCase('user.card');   // 'UserCard'
toPascalCase('x-ui-button'); // 'XUiButton'
toPascalCase('USER-CARD');   // 'USERCARD': the other letters keep their case
