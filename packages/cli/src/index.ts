#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCommand } from './commands/build/build.command';
import { generateCommand } from './commands/generate/generate.command';
import { newCommand } from './commands/new/new.command';
import { prerenderCommand } from './commands/prerender/prerender.command';
import { startCommand } from './commands/start/start.command';
import { testCommand } from './commands/test/test.command';

const version = JSON.parse(readFileSync(resolve(import.meta.filename, '..', '../package.json'), 'utf-8')).version;

program
  .name('xd')
  .description('Xaendar CLI')
  .version(version);

program.addCommand(generateCommand());
program.addCommand(newCommand());
program.addCommand(startCommand());
program.addCommand(buildCommand());
program.addCommand(prerenderCommand());
program.addCommand(testCommand());

program.parse();
