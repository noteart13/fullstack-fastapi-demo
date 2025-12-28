/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  output: "standalone",
  // Ensure proper routing for client-side navigation
  trailingSlash: false,
  // Disable strict mode to avoid double rendering in development
  reactStrictMode: true,
};
