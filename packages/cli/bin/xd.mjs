#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { register } from 'tsx/esm/api';

const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url));

register({ tsconfig });
await import('../src/index.ts');
