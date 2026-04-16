import { execSync } from 'child_process';
import { resolve } from 'path';

const projectsRoot = '../packages';

const projects = [
  'common',
  'core',
  'compiler',
  'signals',
];

type BumpType = 'patch' | 'minor' | 'major';

function parseBump(): BumpType {
  const arg = process.argv.find(a => a.startsWith('--bump='));
  if (!arg) {
    console.error('Devi specificare --bump=patch|minor|major');
    process.exit(1);
  }
  const value = arg.split('=')[1];

  if (value === 'patch' || value === 'minor' || value === 'major') {
    return value;
  } else {
    console.error(`Valore bump non valido: "${value}". Usa patch, minor o major.`);
    process.exit(1);
  }
}

function run(cmd: string, cwd: string) {
  execSync(cmd, { stdio: 'inherit', cwd });
}

async function publishAll() {
  const bump = parseBump();

  console.log(`\nPubblicazione pacchetti @xaendar con bump: ${bump}\n`);

  for (const project of projects) {
    const projectPath = resolve(projectsRoot, project);
    console.log(`\n> @xaendar/${project}`);

    try {
      console.log(`  Aggiornamento versione (${bump})...`);
      run(`npm version ${bump} --no-git-tag-version`, projectPath);

      console.log(`  Pubblicazione su npm...`);
      run('npm publish --access public', projectPath);

      console.log(`  @xaendar/${project} pubblicato`);
    } catch (err) {
      const error = err as Error;
      console.error(`\n@xaendar/${project} fallito:`, error.message);
      process.exit(1);
    }
  }

  console.log('\nTutti i pacchetti pubblicati con successo!');
}

function checkAuth() {
  try {
    const user = execSync('npm whoami', { stdio: 'pipe' }).toString().trim();
    console.log(`Loggato come: ${user}`);
  } catch {
    console.error('Non sei loggato su npm. Esegui:');
    console.error('   npm login');
    console.error('   oppure imposta NPM_TOKEN nel tuo ambiente');
    process.exit(1);
  }
}

checkAuth();
publishAll();