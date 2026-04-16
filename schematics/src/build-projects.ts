import { resolve } from 'path';
import { build } from 'vite';

const projectsRoot = '../packages';

async function buildAll() {
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
      await build({
        root: projectPath,
        configFile: resolve(projectPath, 'vite.config.ts')
      });
      console.log(`✅ @xaendar/${project} completato`);
    } catch (err) {
      const error = err as Error
      console.error(`❌ @xaendar/${project} fallito:`, error.message);
    }
  }
}

buildAll();