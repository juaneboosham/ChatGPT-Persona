/** @type {import('next').NextConfig} */
require('dotenv').config()

const IMAGE_HOSTS = process.env.IMAGE_HOSTS
console.log('IMAGE_HOSTS', IMAGE_HOSTS)
console.log('process.env.IMAGE_HOSTS', process.env);

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
        hostname: "image-bed.vercel.app",
        port: '',
        pathname: '/chatGPT/**',
      },
    ],
  },
};

module.exports = nextConfig;
