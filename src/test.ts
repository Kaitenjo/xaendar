import { compile } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `
<div class="shell">

  <div class="shell__main">

    <main class="shell__content">
      <input @(showPlaceholder(), @input="@onInput($event)") />
      <button @click="onButtonClick()">Toggle Placeholder</button>
    </main>
  </div>
</div>

`

const filePath = 'dist/compiled.js'
compile(template, { baseDir: 'asd', cssVariableName: 'asd', signals: ['csollapsed'] }).then(output => {
  writeFileSync(filePath, output.javascript);
  writeFileSync('dist/compiled.ts', output.typescript.text);
}).catch(err => {
  console.error(`Failed to compile template: ${err}`)
});
