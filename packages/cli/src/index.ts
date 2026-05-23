#!/usr/bin/env node
import { program } from 'commander';
import { generateCommand } from './commands/generate/generate.command.js';
import { newCommand } from './commands/new/new.command.js';

program
  .name('xd')
  .description('Xaendar CLI')
  .version('0.2.0');

program.addCommand(generateCommand());
program.addCommand(newCommand());

program.parse();
