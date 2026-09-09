import { compile } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `
  <aside class="{ collapsed() ? 'sidebar sidebar--collapsed' : 'sidebar'}" />
  <div @(porcodio dioocane="{vaffanculo}" madonna="{\`bastarda\`}" @event="handler()" @event2="handler2(param1, param2, true, null, 1, 'cazzo')") />
`

const filePath = 'dist/compiled.js'
compile(template, { baseDir: 'asd', cssVariableName: 'asd', signals: ['csollapsed'] }).then(output => {
  writeFileSync(filePath, output.javascript);
  writeFileSync('dist/compiled.ts', output.typescript.text);
}).catch(err => {
  console.error(`Failed to compile template:${String(err.message.replace(/^Error:\s*/, ''))}`)
});
