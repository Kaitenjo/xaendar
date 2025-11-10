import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { sync } from 'glob';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

// Converte l'URL del modulo in path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, '..', '..', '..');

const outDir = join(parentDir, 'build');
if (!existsSync(outDir)) {
  mkdirSync(outDir);
}

const cppFiles = sync('src/**/*.cpp').map(f => `"${f}"`).join(' ');
const outFile = join(outDir, 'compiler.exe');

const cmd = `powershell -Command "& { C:\\msys64\\ucrt64\\bin\\g++.exe -g ${cppFiles} -o '${outFile}' -I C:\\antlr4 }"`;
execSync(cmd, { stdio: 'inherit' });
