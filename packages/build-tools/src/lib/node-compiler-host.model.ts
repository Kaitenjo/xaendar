import { CompilerHost } from '@xaendar/compiler';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'fs';
import { resolve } from 'path';

export class NodeCompilerHost implements CompilerHost {
  
  public fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  public getCurrentDirectory(): string {
    return process.cwd();
  }

  public getDirectoryEntries(dirPath: string): string[] {
    try {
      return readdirSync(dirPath);
    } catch {
      return [];
    }
  }

  public getRealPath(filePath: string): string {
    return realpathSync(filePath);
  }

  public isDirectory(filePath: string): boolean {
    try {
      return statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  public readFile(filePath: string): string | undefined {
    try {
      return readFileSync(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  public resolvePath(from: string, to: string): string {
    return resolve(from, to);
  }
}