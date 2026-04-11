import path from 'path';
import { UserConfig } from 'vite';

const external = [
  '@xendar/common',
  '@xendar/compiler',
  '@xendar/core',
  '@xendar/signals'
]

export default function getBaseViteConfig(name: string, dirName: string): UserConfig {
  const fileName = name.split('/').join('-').slice(1);
  return {
    build: {
      target: 'esnext',
      lib: {
        entry: path.resolve(dirName, 'src/public-api.ts'),
        name,
        fileName: format => `${fileName}.${format}.js`,
        formats: ['es']
      },
      rollupOptions: {
        output: {
          dir: path.resolve(dirName, `../../dist/${name}`),
        },
        external
      },
    }
  }
}