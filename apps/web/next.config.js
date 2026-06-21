/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@group-cms/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
