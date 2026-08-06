/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@platform/ui',
    '@platform/utils',
    '@platform/types',
    '@platform/api-client',
    '@platform/auth',
    '@platform/research-sdk',
    '@platform/workflow-sdk',
    '@platform/order-sdk',
    '@platform/execution-engine-sdk',
    '@platform/sor-sdk',
    '@platform/tca-sdk',
  ],
  // ESLint runs as its own pipeline task (`turbo lint`); keep it out of the
  // build critical path. TypeScript errors DO fail the build (strict compile).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
