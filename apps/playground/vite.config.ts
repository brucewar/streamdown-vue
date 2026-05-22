import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const playgroundRoot = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(playgroundRoot, '../..');
const streamdownRoot = resolve(repoRoot, 'packages/streamdown');
const streamdownEntry = resolve(streamdownRoot, 'index.ts');
const streamdownStyles = resolve(streamdownRoot, 'styles.css');
const repoSlug = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS === 'true' && repoSlug ? `/${repoSlug}/` : '/';

export default defineConfig({
  base,
  plugins: [vue(), tailwindcss()],
  root: playgroundRoot,
  resolve: {
    alias: [
      {
        find: '@brucekit/streamdown-vue/styles.css',
        replacement: streamdownStyles,
      },
      { find: '@brucekit/streamdown-vue', replacement: streamdownEntry },
    ],
    dedupe: ['vue'],
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: resolve(playgroundRoot, 'dist'),
    emptyOutDir: true,
  },
});
