/** @type {import('next').NextConfig} */
require('dotenv').config()


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
