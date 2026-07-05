/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg is a server-only dependency; keep it out of any client bundle.
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
