import { execSync } from 'child_process';
import { resolve } from 'path';

const projectsRoot = '../packages';

async function compileAll() {
  // Todo: Order of build should be based on dependencies between projects and not hardcoded
  const projects = [
    'common',
    'core',
    'compiler',
    'signals'
  ]

  for (const project of projects) {
    const projectPath = resolve(projectsRoot, project);
    console.log(`\n▶ Build: @xaendar/${project}`);

    try {
      execSync('tsc --noEmit', { stdio: 'inherit', cwd: projectPath })
      console.log(`✅ @xaendar/${project} completato`);
    } catch (err) {
      console.error(`❌ Typescript Compilation failed for @xaendar/${project}:`);
      throw err;
    }
  }
}

compileAll();