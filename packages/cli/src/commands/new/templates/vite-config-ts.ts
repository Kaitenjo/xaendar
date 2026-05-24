/**
 * Generates the content of the project `vite.config.ts`.
 *
 * @returns The formatted TypeScript source string.
 */
export function viteConfigTs(): string {
  return `import babel from "@rolldown/plugin-babel";
import { xaendarPlugin } from "@xaendar/build-tools";
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    open: true,
    port: 4200
  },
  plugins: [
    babel({
      presets: [
        {
          preset: () => ({
            plugins: [
              [
                "@babel/plugin-proposal-decorators",
                { version: "2023-11" }
              ]
            ]
          }),
          rolldown: {
            filter: {
              code: "@"
            }
          }
        }
      ]
    }),
    xaendarPlugin()
  ]
});`;
}
