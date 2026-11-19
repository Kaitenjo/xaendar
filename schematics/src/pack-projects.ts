import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Packs all built packages found under `../dist/@xaendar` into `.tgz` tarballs
 * and places them in `../output`.
 *
 * For each package, runs `npm pack --pack-destination ../../../output` in its
 * build directory, one after the other, through the default shell of the system
 * (`cmd.exe` on Windows, `/bin/sh` elsewhere), so it runs on Windows as on the
 * Linux runners of GitHub Actions. The `../output` folder is created anew.
 *
 * A package failing to pack fails the script (exit code `1`) after the others are packed.
 *
 * @example
 * // ../dist/@xaendar/ contains: core/, ui/
 * // After running:
 * // ../output/
 * //   xaendar-core-1.0.0.tgz
 */
function packAll(): void {
  const outputPath = '../output';
  const buildPackagesPath = '../dist/@xaendar';

  if (existsSync(outputPath)) {
    rmSync(outputPath, { recursive: true, force: true });
  }

  mkdirSync(outputPath);

  const projects = readdirSync(buildPackagesPath);

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const projectPath = resolve(buildPackagesPath, project);

    console.log(`\n▶ Pack: ${project}`);

    try {
      execSync('npm pack --pack-destination ../../../output', { cwd: projectPath, stdio: 'inherit' });
      console.log(`✅ ${project} completato`);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ ${project} fallito:`, error.message);
      process.exitCode = 1;
    }
  }
}

packAll();
