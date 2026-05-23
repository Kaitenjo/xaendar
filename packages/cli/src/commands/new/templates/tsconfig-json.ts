/**
 * Generates the content of the project `tsconfig.json`.
 *
 * Targets ES2026, uses `moduleResolution: bundler` for Vite compatibility,
 * and enables the strictest type-checking options available in TypeScript 6.
 * Several options that were non-default in earlier versions are now the
 * TypeScript 6 default and are therefore omitted.
 *
 * @returns The formatted JSON string.
 */
export function tsconfigJson(): string {
  return `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.spec.ts"]
}
`;
}
