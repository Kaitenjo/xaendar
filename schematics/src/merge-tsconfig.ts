import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { TsConfigJson } from 'type-fest';

function merge(sourcePath: string): void {
  const tsConfigPath = resolve('..', 'tsconfig.json');
  const sourceTsConfigPath = resolve('..', sourcePath);
  
  const tsConfig: TsConfigJson = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));
  const sourceTsConfig: TsConfigJson = JSON.parse(readFileSync(sourceTsConfigPath, 'utf-8'));
  
  const newTsConfig = mergeDeep(true, tsConfig, sourceTsConfig);
  
  writeFileSync(tsConfigPath, JSON.stringify(newTsConfig, null, 2), 'utf-8');
}

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 * @param overrideArray - Override array instead merging them
 * @param objects - Objects to merge
 * @returns New object with merged key/values
 */
export function mergeDeep(overrideArray: boolean, ...objects: any[]): any {
  const isObject = (obj: any): boolean => !!obj && typeof obj === 'object';

  return objects.reduce((prev: Record<string, any>, obj: Record<string, any>) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        if (overrideArray) {
          prev[key] = oVal;
        } else {
          prev[key] = [...new Set([...oVal, ...pVal])];
        }
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(overrideArray, pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

// Legge il path sorgente dagli argomenti CLI: ts-node script.ts <source>
const [, , source] = process.argv;

if (!source) {
  console.error('Usage: ts-node script.ts <source-tsconfig-path>');
  process.exit(1);
}

merge(source);