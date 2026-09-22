import { compile } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `Ciao`

const filePath = 'dist/compiled.js'
compile(template, { cssVariableName: 'asd', signals: ['csollapsed'], cache: { getOrInsert: () => {} } as any }).then(output => {
  writeFileSync(filePath, output);
}).catch(err => {
  console.error(`Failed to compile template: ${err}`)
});
