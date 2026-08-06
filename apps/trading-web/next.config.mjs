/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@platform/ui',
    '@platform/utils',
    '@platform/types',
    '@platform/api-client',
    '@platform/order-sdk',
    '@platform/execution-engine-sdk',
    '@platform/sor-sdk',
    '@platform/tca-sdk',
    '@platform/broker-sdk',
  ],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
