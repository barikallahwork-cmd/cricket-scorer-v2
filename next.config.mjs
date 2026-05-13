/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/cricket-scorer',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
