import { CompilerHost } from '@xaendar/compiler';
import * as fs from 'fs';
import * as path from 'path';

export class NodeCompilerHost implements CompilerHost {
  
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  getCurrentDirectory(): string {
    return process.cwd();
  }

  getDirectoryEntries(dirPath: string): string[] {
    try {
      return fs.readdirSync(dirPath);
    } catch {
      return [];
    }
  }

  getRealPath(filePath: string): string {
    return fs.realpathSync(filePath);
  }

  isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  readFile(filePath: string): string | undefined {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  resolvePath(from: string, to: string): string {
    return path.resolve(from, to);
  }
}