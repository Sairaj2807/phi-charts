import nextra from 'nextra';

// Static-exported to GitHub Pages at https://sairaj2807.github.io/phi-charts/
const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  staticImage: true,
});

export default withNextra({
  // Keep the live local preview available while building the static export.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  output: 'export',
  images: { unoptimized: true },
  basePath: '/phi-charts',
  trailingSlash: true,
  reactStrictMode: true,
});
