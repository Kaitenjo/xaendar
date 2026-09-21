import { compile } from "@xaendar/compiler";
import { writeFileSync } from "fs";

const template = `
<div class="shell">
  <app-sidebar @(applyDinamicBinding(), icon="{a()}") collapsed="{sidebarCollapsed()}" @collapsedChange="onCollapseChange($event)" />
  <button @click="onApplyDinamicBindingToggle()">
    Toggle dinamic binding
  </button>

  <div class="shell__main">
    <app-topbar @menuToggle="onSidebarToggle()" />

    <main class="shell__content">
      <app-form />
    </main>
  </div>
</div>

`

const filePath = 'dist/compiled.js'
compile(template, { cssVariableName: 'asd', signals: ['csollapsed'], cache: { getOrInsert: () => {} } as any }).then(output => {
  writeFileSync(filePath, output);
}).catch(err => {
  console.error(`Failed to compile template: ${err}`)
});
