/*
  The application is exported as a static site into the public folder of the documentation, which serves it in
  an iframe at /demos/next/ — and the verifier serves the very same folder at the root of its server. Every
  asset URL must therefore be relative, which is what `assetPrefix: './'` produces.
*/

/**
 * The configuration of the demo.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  assetPrefix: './',
  images: { unoptimized: true },
  output: 'export'
};

export default nextConfig;
