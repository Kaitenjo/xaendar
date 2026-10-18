import { indent } from '@xaendar/common';

indent('return value;');                   // '  return value;'
indent(['if (ready) {', '  run();', '}']); // ['  if (ready) {', '    run();', '  }']
indent(indent(['run();']));                // ['    run();']: one level per call

/**
 * A block of three lines, in one string.
 */
const block = 'if (ready) {\n  run();\n}';

indent(block);                             // ✗ '  if (ready) {\n  run();\n}': only the first line is indented
indent(block.split('\n')).join('\n');      // ✓ '  if (ready) {\n    run();\n  }'
