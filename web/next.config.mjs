/** @type {import('next').NextConfig} */
const nextConfig = {
  // postgres.js is server-only; keep the driver out of every client bundle.
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
};

export default nextConfig;
