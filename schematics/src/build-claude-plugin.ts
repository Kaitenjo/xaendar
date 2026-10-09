import { resolve } from 'node:path';
import { build as tsupBuild } from 'tsup';

/**
 * Bundles `@xaendar/language-server` into the Claude Code plugin under `plugins/xaendar/server`.
 *
 * TypeScript stays external: a bundled copy would look for its `lib.*.d.ts` files next to the bundle,
 * so the plugin's `.lsp.json` resolves it from the user's project through `NODE_PATH`.
 */
async function runBuildClaudePlugin(): Promise<void> {
  await tsupBuild({
    entry: { server: resolve('../packages/language-server/src/lib/server.ts') },
    outDir: resolve('../plugins/xaendar/server'),
    format: ['cjs'],
    platform: 'node',
    target: 'node18',
    bundle: true,
    external: ['typescript'],
    dts: false,
    sourcemap: false,
    minify: false,
    clean: true,
    tsconfig: '../tsconfig.json',
  });
}

runBuildClaudePlugin().catch((err: Error) => {
  console.error('❌ build-claude-plugin fallito:', err.message);
  process.exit(1);
});
