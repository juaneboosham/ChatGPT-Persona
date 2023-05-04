/** @type {import('next').NextConfig} */

const IMAGE_HOSTS = process.env.IMAGE_HOSTS
console.log('IMAGE_HOSTS', IMAGE_HOSTS)

const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.IMAGE_HOSTS,
        port: '',
        pathname: '/chatGPT/**',
      },
    ],
  },
};

module.exports = nextConfig;
