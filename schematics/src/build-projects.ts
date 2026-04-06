import { resolve } from 'path';
import { build } from 'vite';

const projectsRoot = '../packages';

async function buildAll() {
  // Todo: Order of build should be based on dependencies between projects and not hardcoded
  const projects = [
    'common',
    'core',
    'compiler'
  ]

  for (const project of projects) {
    const projectPath = resolve(projectsRoot, project);
    console.log(`\n▶ Build: ${project}`);

    try {
      await build({
        root: projectPath,
        configFile: resolve(projectPath, 'vite.config.ts'),
        build: {
          outDir: resolve(projectPath, 'dist'),
          emptyOutDir: true,
        },
        logLevel: 'info',
      });
      console.log(`✅ ${project} completato`);
    } catch (err) {
      console.error(`❌ ${project} fallito:`, err.message);
    }
  }
}

buildAll();