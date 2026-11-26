# From src/docs: install and build the four pages (production builds, into public/comparison)
npm run build:comparison

# Once: Playwright, not a dependency of the site, and the Chromium it drives
npm install --no-save playwright
npx playwright install chromium

# Measure them (1000 runs per page and CPU rate) and write the figures this page shows
node comparison/measure.mjs --runs=1000 --json=src/pages/reference/framework-comparison/framework-comparison.results.json
