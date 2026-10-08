// vite.config.ts — styles are minified with Lightning CSS in builds, unless CSS minification is off
export default defineConfig({
  build: {
    cssMinify: false
  }
});
