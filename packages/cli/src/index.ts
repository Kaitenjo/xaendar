#!/usr/bin/env node
import { program } from 'commander';
import { makeGenerateCommand } from './commands/generate/generate.command.js';
import { makeCompileCommand } from './commands/compile/compile.js';

program
  .name('xd')
  .description('Xaendar CLI')
  .version('0.2.0');

program.addCommand(makeGenerateCommand());
program.addCommand(makeCompileCommand());

program.parse();
