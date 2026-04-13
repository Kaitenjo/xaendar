import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'path';

async function packAll() {
  // Todo: Order of build should be based on dependencies between projects and not hardcoded
  const projects = [
    'common',
    'core',
    'compiler',
    'signals'
  ]
  
  if (!existsSync('../output')) {
    mkdirSync('../output');
  }

  for (const project of projects) {
    const projectPath = resolve('../dist/@xendar', project);

    console.log(`\n▶ Pack: ${project}`);

    try {
      execSync('npm pack --pack-destination ../../../output', {
        cwd: projectPath,
        shell: 'C:\\Windows\\System32\\cmd.exe',
      });
      console.log(`✅ ${project} completato`);
    } catch (err) {
      const error = err as Error
      console.error(`❌ ${project} fallito:`, error.message);
    }
  }
}

packAll();