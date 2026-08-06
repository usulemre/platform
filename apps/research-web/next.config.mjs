/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@platform/ui',
    '@platform/utils',
    '@platform/types',
    '@platform/api-client',
    '@platform/auth',
    '@platform/shell',
    '@platform/research-sdk',
    '@platform/workflow-sdk',
  ],
  // ESLint runs as its own pipeline task (`turbo lint`); keep it out of the
  // build critical path. TypeScript errors DO fail the build (strict compile).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
